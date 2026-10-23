/**
 * Edge dialer-nummer-opret — giver et firma sit eget danske Twilio-nummer (23. okt 2026).
 *
 * MOCK ER DEFAULT: uden TWILIO_MOCK=0 købes intet og Twilio kaldes ikke. Der oprettes et falsk nummer (mock = true).
 *
 * POST /functions/v1/dialer-nummer-opret
 *   Authorization: Bearer <brugerens JWT>   (firmaets Dialer-admin — firmaet er brugerens eget)
 *              ELLER Bearer <service_role>   (onboarding/guide på serveren — organisation_id er påkrævet)
 *   Body (JSON): {
 *     "organisation_id": "<uuid>",          // påkrævet ved service_role; ved bruger-JWT skal det være eget firma (eller udelades)
 *     "handling": "koeb" | "tilknyt",       // default "koeb". "tilknyt" = nummer der allerede ligger på Twilio-kontoen
 *     "nummer": "+4570123456",              // kun ved "tilknyt"
 *     "type": "local" | "mobile",           // kun ved "koeb", default "local"
 *     "indeholder": "7020",                 // kun ved "koeb": ønskede cifre (valgfri)
 *     "navn": "Hovednummer",                // valgfri
 *     "ekstra": false                       // true = firmaet må få et nummer mere
 *   }
 * Svar 200: { ok, mock, handling, telefonnummer: {id, organisation_id, nummer, twilio_number_sid, navn, mock},
 *             webhooks: {voice, sms}, viderestilling: {kode, annuller, tekst} }
 * Fejl: { ok: false, fejl, besked } med 400 / 401 / 403 / 404 / 409 / 502.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { opretNummer, type OpretInput } from "../_shared/nummer-opret.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { ok: false, fejl: 'metode', besked: 'Brug POST' });

  const env = (n: string) => Deno.env.get(n);
  const supabaseUrl = env('SUPABASE_URL')!;
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json(401, { ok: false, fejl: 'login', besked: 'Mangler Authorization' });
  const token = auth.slice(7);

  let body: Partial<OpretInput>;
  try { body = await req.json(); } catch { return json(400, { ok: false, fejl: 'json', besked: 'Body skal være JSON' }); }

  let organisationId = body.organisation_id ?? '';
  let oprettetAf: string | null = null;

  if (token !== serviceKey) {
    // Bruger: skal være Dialer-admin i sit eget firma
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return json(401, { ok: false, fejl: 'login', besked: 'Ugyldigt login' });
    const { data: profil } = await admin.from('dialer_profiles').select('organisation_id').eq('user_id', user.id).maybeSingle();
    if (!profil) return json(403, { ok: false, fejl: 'ingen_adgang', besked: 'Du er ikke bruger i ASA Dialer' });
    if (organisationId && organisationId !== profil.organisation_id) {
      return json(403, { ok: false, fejl: 'andet_firma', besked: 'Du kan kun oprette numre til dit eget firma' });
    }
    organisationId = profil.organisation_id;
    const { data: rolle } = await admin.from('dialer_user_roles').select('role')
      .eq('user_id', user.id).eq('organisation_id', organisationId).eq('role', 'admin').maybeSingle();
    if (!rolle) return json(403, { ok: false, fejl: 'ikke_admin', besked: 'Kun firmaets admin kan oprette numre' });
    oprettetAf = user.id;
  }

  const svar = await opretNummer(
    { ...body, organisation_id: organisationId, oprettet_af: oprettetAf } as OpretInput,
    {
      env,
      fetch,
      db: {
        firmaFindes: async (org) => {
          const { data } = await admin.from('organisations').select('id').eq('id', org).maybeSingle();
          return !!data;
        },
        firmaHarNummer: async (org) => {
          const { count } = await admin.from('dialer_telefonnumre').select('id', { count: 'exact', head: true })
            .eq('organisation_id', org).eq('aktiv', true);
          return (count ?? 0) > 0;
        },
        nummerFindes: async (nummer) => {
          const { data } = await admin.from('dialer_telefonnumre').select('id').eq('nummer', nummer).maybeSingle();
          return !!data;
        },
        indsaet: async (raekke) => {
          const { data, error } = await admin.from('dialer_telefonnumre').insert(raekke)
            .select('id, organisation_id, nummer, twilio_number_sid, navn, mock').single();
          if (error) throw new Error(error.message);
          return data;
        },
      },
    },
  ).catch((e: Error) => ({ status: 500, body: { ok: false, fejl: 'intern', besked: e.message } }));

  console.log(`[dialer-nummer-opret] org=${organisationId} status=${svar.status} mock=${(svar.body as { mock?: boolean }).mock ?? '-'}`);
  return json(svar.status, svar.body);
});
