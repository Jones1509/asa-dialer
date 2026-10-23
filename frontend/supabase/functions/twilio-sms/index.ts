/**
 * Edge twilio-sms — indgående SMS på et firmanummer (23. okt 2026).
 * Firmaet slås op ud fra det kaldte nummer (To). SMS'en gemmes KUN hos det firma (dialer.sms).
 * Ukendt nummer: gemmes ikke. Svarer altid med tom TwiML (intet automatisk svar).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { erMock, gyldigTwilioSignatur, normaliserNummer, twimlTom } from "../_shared/dialer-twilio.ts";

const xml = (twiml: string, status = 200) => new Response(twiml, { status, headers: { 'Content-Type': 'text/xml' } });

serve(async (req) => {
  try {
    const env = (n: string) => Deno.env.get(n);
    const form = await req.formData().catch(() => null);
    const params: Record<string, string> = {};
    form?.forEach((v, k) => { params[k] = String(v); });

    const authToken = erMock(env) ? undefined : env('TWILIO_AUTH_TOKEN');
    const offentligUrl = env('DIALER_SMS_URL') ?? `${env('SUPABASE_URL')}/functions/v1/twilio-sms`;
    if (!(await gyldigTwilioSignatur(authToken, offentligUrl, params, req.headers.get('X-Twilio-Signature')))) {
      return xml(twimlTom(), 403);
    }

    const til = normaliserNummer(params.To);
    if (!til) return xml(twimlTom());

    const admin = createClient(env('SUPABASE_URL')!, env('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: firma } = await admin.rpc('dialer_firma_for_nummer', { p_nummer: til });
    const f = firma?.[0];
    if (!f || !f.sms_aktiv) {
      console.log(`[twilio-sms] Ukendt eller slukket nummer ${til} — ignoreret`);
      return xml(twimlTom());
    }

    const { error } = await admin.from('dialer_sms').insert({
      organisation_id: f.organisation_id,
      telefonnummer_id: f.telefonnummer_id,
      retning: 'indgaaende',
      fra_nummer: params.From ?? '',
      til_nummer: til,
      besked: params.Body ?? '',
      twilio_sid: params.MessageSid ?? null,
    });
    if (error) console.error('[twilio-sms] Kunne ikke gemme:', error.message);
    return xml(twimlTom());
  } catch (error) {
    console.error('[twilio-sms] Fejl:', (error as Error).message);
    return xml(twimlTom());
  }
});
