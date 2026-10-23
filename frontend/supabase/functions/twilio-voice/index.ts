/**
 * Edge twilio-voice — TwiML for Dialerens opkald, multi-tenant (23. okt 2026).
 *
 *  - Udgående (From = "client:<bruger-uuid>"): firmaets eget primære nummer bruges som caller-id.
 *  - Indgående (To = et firmanummer): KUN det firmas godkendte, aktive brugere ringes op (højst 10 samtidig).
 *  - Ukendt nummer / ingen brugere / intet firmanummer: venlig besked og læg på.
 * Firmaet slås op i dialer.telefonnumre (public.dialer_*-funktionerne, kun service_role).
 * X-Twilio-Signature kontrolleres, når TWILIO_MOCK=0 (rigtig drift) og TWILIO_AUTH_TOKEN er sat.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { erMock, gyldigTwilioSignatur, routOpkald, routingTilTwiml, twimlSig } from "../_shared/dialer-twilio.ts";

const xml = (twiml: string, status = 200) => new Response(twiml, { status, headers: { 'Content-Type': 'text/xml' } });

serve(async (req) => {
  try {
    const env = (n: string) => Deno.env.get(n);
    const form = await req.formData().catch(() => null);
    const params: Record<string, string> = {};
    form?.forEach((v, k) => { params[k] = String(v); });

    const authToken = erMock(env) ? undefined : env('TWILIO_AUTH_TOKEN');
    const offentligUrl = env('DIALER_VOICE_URL') ?? `${env('SUPABASE_URL')}/functions/v1/twilio-voice`;
    if (!(await gyldigTwilioSignatur(authToken, offentligUrl, params, req.headers.get('X-Twilio-Signature')))) {
      console.warn('[twilio-voice] Afvist: ugyldig Twilio-signatur');
      return xml(twimlSig('Afvist.'), 403);
    }

    const admin = createClient(env('SUPABASE_URL')!, env('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

    const routing = await routOpkald({ To: params.To, From: params.From }, {
      klienterForNummer: async (nummer) => {
        const { data, error } = await admin.rpc('dialer_klienter_for_nummer', { p_nummer: nummer });
        if (error) throw new Error(error.message);
        return (data ?? []).map((r: { user_id: string }) => r.user_id);
      },
      callerIdForBruger: async (userId) => {
        const { data, error } = await admin.rpc('dialer_callerid_for_bruger', { p_user_id: userId });
        if (error) throw new Error(error.message);
        return data?.[0]?.nummer ?? null;
      },
    });

    console.log(`[twilio-voice] ${routing.type}${routing.type === 'afvis' ? ` (${routing.grund})` : ''} To=${params.To ?? ''}`);
    return xml(routingTilTwiml(routing));
  } catch (error) {
    console.error('[twilio-voice] Fejl:', (error as Error).message);
    return xml(twimlSig('Der opstod en fejl. Prøv igen senere.'));
  }
});
