/**
 * Kernen i Edge dialer-nummer-opret: søg + køb (eller tilknyt) et dansk Twilio-nummer til ét firma og sæt webhooks.
 * MOCK ER DEFAULT (TWILIO_MOCK ≠ "0"): intet API-kald, intet købes — der oprettes et falsk nummer med mock = true.
 * Ren TypeScript (testes i src/test/nummer-opret.test.ts). Netværk og database sendes ind.
 */
import { erMock, normaliserNummer, viderestilling, type Env } from './dialer-twilio.ts';

export interface NummerRaekke {
  id: string;
  organisation_id: string;
  nummer: string;
  twilio_number_sid: string | null;
  navn: string;
  mock: boolean;
}

export interface OpretInput {
  organisation_id: string;
  handling?: 'koeb' | 'tilknyt';
  nummer?: string;            // kun ved "tilknyt": et nummer, der allerede ligger på Twilio-kontoen
  type?: 'local' | 'mobile';  // ved "koeb": fastnet (default) eller mobil
  indeholder?: string;        // ved "koeb": ønskede cifre, fx "7020"
  navn?: string;
  ekstra?: boolean;           // tillad et nummer mere til firmaet (ellers 409, hvis firmaet allerede har et)
  oprettet_af?: string | null;
}

export interface OpretDeps {
  env: Env;
  fetch: typeof fetch;
  db: {
    firmaFindes(orgId: string): Promise<boolean>;
    firmaHarNummer(orgId: string): Promise<boolean>;
    nummerFindes(nummer: string): Promise<boolean>;
    indsaet(raekke: Omit<NummerRaekke, 'id'> & { primaer: boolean; oprettet_af: string | null }): Promise<NummerRaekke>;
  };
  random?: () => number;
}

export interface Svar { status: number; body: Record<string, unknown> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fejl(status: number, kode: string, besked: string): Svar {
  return { status, body: { ok: false, fejl: kode, besked } };
}

export function webhooks(env: Env) {
  const base = (env('SUPABASE_URL') ?? '').replace(/\/$/, '');
  return { voice: `${base}/functions/v1/twilio-voice`, sms: `${base}/functions/v1/twilio-sms` };
}

function mockNummer(rnd: () => number) {
  const cifre = Array.from({ length: 6 }, () => Math.floor(rnd() * 10)).join('');
  const hex = Array.from({ length: 32 }, () => Math.floor(rnd() * 16).toString(16)).join('');
  return { nummer: `+457899${cifre.slice(0, 4)}`, sid: `PN${hex}` };
}

async function twilio(deps: OpretDeps, sti: string, metode: 'GET' | 'POST', felter?: Record<string, string>) {
  const sid = deps.env('TWILIO_ACCOUNT_SID');
  const token = deps.env('TWILIO_AUTH_TOKEN');
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN mangler');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/${sti}`;
  const res = await deps.fetch(url, {
    method: metode,
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: felter ? new URLSearchParams(felter).toString() : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${(data as { message?: string }).message ?? 'ukendt fejl'}`);
  return data as Record<string, unknown>;
}

export async function opretNummer(input: OpretInput, deps: OpretDeps): Promise<Svar> {
  const handling = input.handling ?? 'koeb';
  if (!input.organisation_id || !UUID_RE.test(input.organisation_id)) return fejl(400, 'ugyldig_organisation', 'organisation_id mangler eller er ugyldig');
  if (handling !== 'koeb' && handling !== 'tilknyt') return fejl(400, 'ugyldig_handling', 'handling skal være "koeb" eller "tilknyt"');
  if (input.indeholder && !/^\d{1,8}$/.test(input.indeholder)) return fejl(400, 'ugyldige_cifre', 'indeholder må kun være cifre (1-8)');
  if (!(await deps.db.firmaFindes(input.organisation_id))) return fejl(404, 'ukendt_organisation', 'Firmaet findes ikke');
  const harNummer = await deps.db.firmaHarNummer(input.organisation_id);
  if (harNummer && !input.ekstra) return fejl(409, 'har_nummer', 'Firmaet har allerede et nummer. Send "ekstra": true for at få et til.');

  const mock = erMock(deps.env);
  const hooks = webhooks(deps.env);
  const rnd = deps.random ?? Math.random;
  let nummer: string;
  let sid: string | null;

  try {
    if (handling === 'tilknyt') {
      const n = normaliserNummer(input.nummer);
      if (!n) return fejl(400, 'ugyldigt_nummer', 'nummer skal være et gyldigt telefonnummer (fx +4570123456)');
      nummer = n;
      if (await deps.db.nummerFindes(nummer)) return fejl(409, 'nummer_i_brug', 'Nummeret er allerede knyttet til et firma');
      if (mock) {
        sid = mockNummer(rnd).sid;
      } else {
        const liste = await twilio(deps, `IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(nummer)}`, 'GET');
        const fundet = (liste.incoming_phone_numbers as Array<{ sid: string }> | undefined)?.[0];
        if (!fundet) return fejl(404, 'ikke_paa_konto', 'Nummeret ligger ikke på Twilio-kontoen');
        sid = fundet.sid;
        await twilio(deps, `IncomingPhoneNumbers/${sid}.json`, 'POST', {
          VoiceUrl: hooks.voice, VoiceMethod: 'POST', SmsUrl: hooks.sms, SmsMethod: 'POST',
        });
      }
    } else if (mock) {
      let forsoeg = 0;
      do {
        const m = mockNummer(rnd);
        nummer = m.nummer; sid = m.sid;
      } while ((await deps.db.nummerFindes(nummer)) && ++forsoeg < 5);
    } else {
      const type = input.type === 'mobile' ? 'Mobile' : 'Local';
      const q = new URLSearchParams({ VoiceEnabled: 'true', PageSize: '5' });
      if (input.indeholder) q.set('Contains', input.indeholder);
      const ledige = await twilio(deps, `AvailablePhoneNumbers/DK/${type}.json?${q}`, 'GET');
      const valgt = (ledige.available_phone_numbers as Array<{ phone_number: string }> | undefined)?.[0];
      if (!valgt) return fejl(404, 'ingen_ledige', 'Twilio har ingen ledige danske numre med de ønskede cifre');
      const koeb: Record<string, string> = {
        PhoneNumber: valgt.phone_number, FriendlyName: `ASA Dialer ${input.organisation_id}`,
        VoiceUrl: hooks.voice, VoiceMethod: 'POST', SmsUrl: hooks.sms, SmsMethod: 'POST',
      };
      // Danske numre kræver godkendte adresse-/regulatoriske oplysninger hos Twilio
      const bundle = deps.env('TWILIO_DK_BUNDLE_SID');
      const adresse = deps.env('TWILIO_DK_ADDRESS_SID');
      if (bundle) koeb.BundleSid = bundle;
      if (adresse) koeb.AddressSid = adresse;
      const koebt = await twilio(deps, 'IncomingPhoneNumbers.json', 'POST', koeb);
      nummer = String(koebt.phone_number);
      sid = String(koebt.sid);
    }
  } catch (e) {
    return fejl(502, 'twilio_fejl', (e as Error).message);
  }

  const raekke = await deps.db.indsaet({
    organisation_id: input.organisation_id,
    nummer: nummer!,
    twilio_number_sid: sid!,
    navn: input.navn?.trim() || (harNummer ? 'Ekstra nummer' : 'Hovednummer'),
    mock,
    primaer: !harNummer,
    oprettet_af: input.oprettet_af ?? null,
  });

  return {
    status: 200,
    body: { ok: true, mock, handling, telefonnummer: raekke, webhooks: hooks, viderestilling: viderestilling(raekke.nummer) },
  };
}
