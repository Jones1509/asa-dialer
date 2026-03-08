import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// We load the Twilio SDK from CDN
declare global {
  interface Window {
    Twilio: any;
  }
}

type TwilioStatus = 'loading' | 'ready' | 'error' | 'offline';

export function useTwilioDevice() {
  const [status, setStatus] = useState<TwilioStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const sdkLoadedRef = useRef(false);

  // Load Twilio SDK
  useEffect(() => {
    if (sdkLoadedRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.twilio.com/js/client/releases/1.14.3/twilio.min.js';
    script.async = true;
    script.onload = () => {
      sdkLoadedRef.current = true;
      initDevice();
    };
    script.onerror = () => {
      setStatus('error');
      setError('Kunne ikke indlæse Twilio SDK');
    };
    document.head.appendChild(script);

    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, []);

  const initDevice = useCallback(async () => {
    try {
      setStatus('loading');
      
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
        throw new Error(data.error || 'Token fejl');
      }

      const { token } = await response.json();

      if (!window.Twilio?.Device) {
        throw new Error('Twilio SDK ikke tilgængelig');
      }

      // Destroy existing device
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }

      const device = new window.Twilio.Device(token, {
        codecPreferences: ['opus', 'pcmu'],
        closeProtection: true,
      });

      device.on('ready', () => {
        setStatus('ready');
        setError(null);
      });

      device.on('error', (err: any) => {
        console.error('Twilio Device error:', err);
        setError(err.message);
      });

      device.on('offline', () => {
        setStatus('offline');
        // Try to reconnect after a delay
        setTimeout(() => initDevice(), 5000);
      });

      deviceRef.current = device;
    } catch (err: any) {
      console.error('Twilio init error:', err);
      setStatus('error');
      setError(err.message);
    }
  }, []);

  const makeCall = useCallback((phoneNumber: string): any => {
    if (!deviceRef.current || status !== 'ready') {
      console.error('Device not ready');
      return null;
    }

    const connection = deviceRef.current.connect({ To: phoneNumber });
    activeCallRef.current = connection;
    return connection;
  }, [status]);

  const hangUp = useCallback(() => {
    if (deviceRef.current) {
      deviceRef.current.disconnectAll();
    }
    activeCallRef.current = null;
  }, []);

  return {
    status,
    error,
    makeCall,
    hangUp,
    reinitialize: initDevice,
  };
}
