import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // This endpoint is called by Twilio when a call is initiated from the browser
  // It returns TwiML that tells Twilio to dial the number
  const formData = await req.formData().catch(() => null);
  const url = new URL(req.url);
  
  let toNumber = formData?.get('To') as string || url.searchParams.get('To') || '';
  
  // If no number provided, return empty response
  if (!toNumber) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say language="da-DK">Intet nummer angivet.</Say></Response>`;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const callerId = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
});
