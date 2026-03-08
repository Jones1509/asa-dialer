import { useState, useRef, useCallback, useEffect } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { supabase } from '@/integrations/supabase/client';

type TwilioStatus = 'loading' | 'ready' | 'error' | 'offline';

export function useTwilioDevice() {
  const [status, setStatus] = useState<TwilioStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const initAttemptedRef = useRef(false);

  // Check mic permission on mount — don't block VoIP if check fails
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.log('getUserMedia not available, assuming mic allowed');
      setMicAllowed(true);
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach(t => t.stop());
        console.log('Mic permission granted');
        setMicAllowed(true);
      })
      .catch((err) => {
        console.warn('Mic permission check failed:', err.message, '- still allowing VoIP attempts');
        // Still set true — Twilio SDK will handle the actual permission prompt
        setMicAllowed(true);
      });
  }, []);

  const initDevice = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setError('Ikke logget ind');
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/twilio-token`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Token fejl (${response.status})`);
      }

      const { token } = await response.json();

      if (deviceRef.current) {
        deviceRef.current.destroy();
      }

      const device = new Device(token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        closeProtection: true,
      });

      device.on('registered', () => {
        console.log('Twilio Device registered');
        setStatus('ready');
        setError(null);
      });

      device.on('error', (err) => {
        console.error('Twilio Device error:', err);
        setError(err.message);
      });

      device.on('unregistered', () => {
        setStatus('offline');
      });

      device.on('tokenWillExpire', async () => {
        try {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (!newSession) return;
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/twilio-token`,
            {
              headers: {
                'Authorization': `Bearer ${newSession.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (res.ok) {
            const { token: newToken } = await res.json();
            device.updateToken(newToken);
          }
        } catch (e) {
          console.error('Token refresh failed:', e);
        }
      });

      await device.register();
      deviceRef.current = device;
    } catch (err: any) {
      console.error('Twilio init error:', err);
      setStatus('error');
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!initAttemptedRef.current) {
      initAttemptedRef.current = true;
      initDevice();
    }
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, [initDevice]);

  const makeCall = useCallback(async (phoneNumber: string): Promise<boolean> => {
    // If mic is not allowed, don't even try Twilio — return false so caller uses tel: fallback
    if (!micAllowed) {
      console.log('Mic not allowed, skipping Twilio');
      return false;
    }

    if (!deviceRef.current || status !== 'ready') {
      console.error('Device not ready, status:', status);
      return false;
    }

    try {
      const call = await deviceRef.current.connect({
        params: { To: phoneNumber },
      });

      activeCallRef.current = call;

      call.on('disconnect', () => {
        console.log('Call disconnected');
        activeCallRef.current = null;
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        activeCallRef.current = null;
      });

      return true;
    } catch (err) {
      console.error('Failed to connect call:', err);
      return false;
    }
  }, [status, micAllowed]);

  const hangUp = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
      activeCallRef.current = null;
    }
  }, []);

  // canMakeVoipCall is true only when device is ready AND mic is allowed
  const canMakeVoipCall = status === 'ready' && micAllowed === true;

  return {
    status,
    error,
    makeCall,
    hangUp,
    reinitialize: initDevice,
    micAllowed,
    canMakeVoipCall,
  };
}
