import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getOrCreateConfig(supabaseAdmin: any) {
  const { data: configs } = await supabaseAdmin
    .from('twilio_config')
    .select('key, value');

  const configMap: Record<string, string> = {};
  if (configs) {
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
  }

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
  const authHeader = btoa(`${accountSid}:${authToken}`);

  if (!configMap['twiml_app_sid']) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const voiceUrl = `${supabaseUrl}/functions/v1/twilio-voice`;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: 'Lovable Dialer',
          VoiceUrl: voiceUrl,
          VoiceMethod: 'POST',
        }),
      }
    );
    const app = await res.json();
    if (!app.sid) throw new Error(`Failed to create TwiML App: ${JSON.stringify(app)}`);
    
    configMap['twiml_app_sid'] = app.sid;
    await supabaseAdmin.from('twilio_config').upsert({ key: 'twiml_app_sid', value: app.sid }, { onConflict: 'key' });
  }

  if (!configMap['api_key_sid'] || !configMap['api_key_secret']) {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Keys.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: 'Lovable Dialer Key',
        }),
      }
    );
    const key = await res.json();
    if (!key.sid) throw new Error(`Failed to create API Key: ${JSON.stringify(key)}`);

    configMap['api_key_sid'] = key.sid;
    configMap['api_key_secret'] = key.secret;
    await supabaseAdmin.from('twilio_config').upsert({ key: 'api_key_sid', value: key.sid }, { onConflict: 'key' });
    await supabaseAdmin.from('twilio_config').upsert({ key: 'api_key_secret', value: key.secret }, { onConflict: 'key' });
  }

  return configMap;
}

function generateAccessToken(
  accountSid: string,
  apiKeySid: string,
  apiKeySecret: string,
  identity: string,
  twimlAppSid: string
): string {
  const header = { alg: 'HS256', typ: 'JWT', cty: 'twilio-fpa;v=1' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    sub: accountSid,
    exp: now + 3600,
    nbf: now,
    grants: {
      identity: identity,
      voice: {
        outgoing: { application_sid: twimlAppSid },
        incoming: { allow: true },
      },
    },
  };

  const encode = (obj: any) => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyData = new TextEncoder().encode(apiKeySecret);
  const data = new TextEncoder().encode(signingInput);
  
  return (async () => {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${signingInput}.${sigB64}`;
  })();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[twilio-token] Request received');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[twilio-token] No auth header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate user token explicitly (verify_jwt is false)
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      console.error('[twilio-token] Auth failed:', userError?.message || 'No user');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[twilio-token] Authenticated user:', user.id);

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;

    const config = await getOrCreateConfig(adminClient);
    console.log('[twilio-token] Config loaded, generating token...');
    
    const twilioToken = await generateAccessToken(
      accountSid,
      config['api_key_sid'],
      config['api_key_secret'],
      user.id,
      config['twiml_app_sid']
    );

    console.log('[twilio-token] Token generated successfully');

    return new Response(JSON.stringify({ token: twilioToken, identity: user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[twilio-token] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
