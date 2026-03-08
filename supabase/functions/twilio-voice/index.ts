import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData().catch(() => null);
    const url = new URL(req.url);

    const toNumber = formData?.get('To') as string || url.searchParams.get('To') || '';
    const fromNumber = formData?.get('From') as string || url.searchParams.get('From') || '';
    const direction = formData?.get('Direction') as string || '';
    const callerId = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

    console.log(`[twilio-voice] Request - To: ${toNumber}, From: ${fromNumber}, Direction: ${direction}`);

    // Determine if this is an incoming call (To = our Twilio number) or outgoing (To = some other number)
    const isIncoming = toNumber === callerId || toNumber.startsWith('client:') === false && fromNumber !== callerId && toNumber === callerId;
    
    // OUTGOING CALL: Browser client is calling a phone number
    if (toNumber && toNumber !== callerId && !toNumber.startsWith('client:')) {
      console.log(`[twilio-voice] Outgoing call to ${toNumber}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // INCOMING CALL: Someone is calling our Twilio number
    // Ring all online browser clients simultaneously
    console.log('[twilio-voice] Incoming call detected, ringing all online clients...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all approved and active users to ring
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('approved', true)
      .eq('active', true);

    if (!profiles || profiles.length === 0) {
      console.log('[twilio-voice] No active users found');
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="da-DK">Der er ingen tilgængelige sælgere lige nu. Prøv igen senere.</Say>
</Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // Build Client entries for all active users — they'll all ring simultaneously
    const clientEntries = profiles
      .map(p => `    <Client>${p.user_id}</Client>`)
      .join('\n');

    console.log(`[twilio-voice] Ringing ${profiles.length} clients`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${fromNumber}" timeout="30" action="">
${clientEntries}
  </Dial>
  <Say language="da-DK">Ingen svarede. Prøv igen senere.</Say>
</Response>`;

    return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('[twilio-voice] Error:', error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="da-DK">Der opstod en fejl. Prøv igen senere.</Say>
</Response>`;
    return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }
});
