import { useState, useRef, useCallback, useEffect } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { supabase } from '@/integrations/supabase/client';

type TwilioStatus = 'loading' | 'ready' | 'error' | 'offline';

export interface IncomingCallInfo {
  from: string;
  callObject: Call;
}

interface UseTwilioDeviceOptions {
  onCallDisconnected?: () => void;
  onIncomingCall?: (info: IncomingCallInfo) => void;
}

export function useTwilioDevice(options?: UseTwilioDeviceOptions) {
  const [status, setStatus] = useState<TwilioStatus>('loading');
  const retryCountRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  

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
        // Auto-reconnect on error
        setTimeout(() => {
          console.log('[Twilio] Auto-reconnecting after error...');
          device.register().catch(e => console.error('[Twilio] Re-register failed:', e));
        }, 3000);
      });

      device.on('unregistered', () => {
        console.log('[Twilio] Device unregistered, attempting re-register...');
        setStatus('offline');
        setTimeout(() => {
          if (deviceRef.current === device) {
            device.register().catch(e => console.error('[Twilio] Re-register failed:', e));
          }
        }, 3000);
      });

      // Handle incoming calls
      device.on('incoming', (call: Call) => {
        console.log('[Twilio] Incoming call from:', call.parameters?.From);
        activeCallRef.current = call;

        call.on('disconnect', () => {
          console.log('[Twilio] Incoming call disconnected');
          activeCallRef.current = null;
          options?.onCallDisconnected?.();
        });
        call.on('cancel', () => {
          console.log('[Twilio] Incoming call cancelled');
          activeCallRef.current = null;
          options?.onCallDisconnected?.();
        });

        options?.onIncomingCall?.({
          from: call.parameters?.From || 'Ukendt',
          callObject: call,
        });
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
      setStatus('loading'); // Never show offline/error — keep trying
      setError(err.message);
      // Auto-retry with exponential backoff
      const delay = Math.min(3000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current += 1;
      console.log(`[Twilio] Retrying in ${delay}ms (attempt ${retryCountRef.current})...`);
      setTimeout(() => initDevice(), delay);
    }
  }, []);

  useEffect(() => {
    // Always init on mount (handles HMR and page reloads)
    initDevice();
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, [initDevice]);

  const makeCall = useCallback(async (phoneNumber: string): Promise<boolean> => {
    console.log(`[Twilio] makeCall called with number: "${phoneNumber}", status: ${status}, micAllowed: ${micAllowed}`);
    
    if (!deviceRef.current || status !== 'ready') {
      console.error(`[Twilio] Device not ready. status=${status}, device=${!!deviceRef.current}`);
      return false;
    }

    try {
      console.log(`[Twilio] Connecting call to: ${phoneNumber}`);
      const call = await deviceRef.current.connect({
        params: { To: phoneNumber },
      });
      console.log(`[Twilio] Call connected successfully to: ${phoneNumber}`);

      activeCallRef.current = call;

      call.on('disconnect', () => {
        console.log('Call disconnected');
        activeCallRef.current = null;
        options?.onCallDisconnected?.();
      });

      call.on('cancel', () => {
        console.log('Call cancelled');
        activeCallRef.current = null;
        options?.onCallDisconnected?.();
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        activeCallRef.current = null;
        options?.onCallDisconnected?.();
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

  const acceptCall = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.accept();
      console.log('[Twilio] Incoming call accepted');
    }
  }, []);

  const rejectCall = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.reject();
      activeCallRef.current = null;
      console.log('[Twilio] Incoming call rejected');
    }
  }, []);

  const canMakeVoipCall = status === 'ready' && micAllowed === true;

  return {
    status,
    error,
    makeCall,
    hangUp,
    acceptCall,
    rejectCall,
    reinitialize: initDevice,
    micAllowed,
    canMakeVoipCall,
  };
}
