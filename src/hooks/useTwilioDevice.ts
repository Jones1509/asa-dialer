import { useState, useRef, useCallback, useEffect } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { supabase } from '@/integrations/supabase/client';

type TwilioStatus = 'loading' | 'ready' | 'error' | 'offline';

export function useTwilioDevice() {
  const [status, setStatus] = useState<TwilioStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const initAttemptedRef = useRef(false);

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

      // Destroy existing device
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
        console.log('Twilio Device unregistered');
        setStatus('offline');
      });

      device.on('tokenWillExpire', async () => {
        console.log('Twilio token expiring, refreshing...');
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

  const makeCall = useCallback(async (phoneNumber: string) => {
    if (!deviceRef.current || status !== 'ready') {
      console.error('Device not ready, status:', status);
      return null;
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

      return call;
    } catch (err) {
      console.error('Failed to connect call:', err);
      return null;
    }
  }, [status]);

  const hangUp = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
      activeCallRef.current = null;
    }
  }, []);

  return {
    status,
    error,
    makeCall,
    hangUp,
    reinitialize: initDevice,
  };
}
