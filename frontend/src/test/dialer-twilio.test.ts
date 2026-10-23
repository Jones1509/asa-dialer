/**
 * Multi-tenant Twilio-logik (Edge twilio-voice + dialer-nummer-opret) med 2 falske firmaer.
 * Ingen netværk: database og fetch er falske. Selve RLS-adskillelsen testes i asa-industries-db
 * (tests/rls-scenarier-dialer.sql).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  erMock, normaliserNummer, klientIdentitet, routOpkald, routingTilTwiml, twilioSignatur, gyldigTwilioSignatur,
  viderestilling, type RoutingDb,
} from '../../supabase/functions/_shared/dialer-twilio';
import { opretNummer, type OpretDeps, type NummerRaekke } from '../../supabase/functions/_shared/nummer-opret';

const ORG_A = 'a0000000-0000-0000-0000-00000000000a';
const ORG_B = 'b0000000-0000-0000-0000-00000000000b';
const A_ADMIN = 'a00000aa-0000-0000-0000-000000000000';
const A_SAELGER = 'a00000a1-0000-0000-0000-000000000000';
const B_SAELGER = 'b00000b1-0000-0000-0000-000000000000';
const NR_A = '+4570000001';
const NR_B = '+4570000002';

/** Falsk database med samme semantik som public.dialer_klienter_for_nummer / dialer_callerid_for_bruger */
function falskDb(): RoutingDb {
  const numre: Record<string, string> = { [NR_A]: ORG_A, [NR_B]: ORG_B };
  const brugere = [
    { id: A_ADMIN, org: ORG_A, ok: true },
    { id: A_SAELGER, org: ORG_A, ok: true },
    { id: 'a00000a2-0000-0000-0000-000000000000', org: ORG_A, ok: false },
    { id: B_SAELGER, org: ORG_B, ok: true },
  ];
  return {
    klienterForNummer: async (n) => brugere.filter((b) => b.ok && b.org === numre[n]).map((b) => b.id),
    callerIdForBruger: async (u) => {
      const b = brugere.find((x) => x.id === u && x.ok);
      return b ? Object.keys(numre).find((n) => numre[n] === b.org) ?? null : null;
    },
  };
}

describe('nummer og identitet', () => {
  it('normaliserer danske numre til E.164', () => {
    expect(normaliserNummer('70 00 00 01')).toBe('+4570000001');
    expect(normaliserNummer('004570000001')).toBe('+4570000001');
    expect(normaliserNummer('4570000001')).toBe('+4570000001');
    expect(normaliserNummer('+4570000001')).toBe('+4570000001');
    expect(normaliserNummer('client:abc')).toBeNull();
    expect(normaliserNummer('')).toBeNull();
  });
  it('læser kun gyldige uuid-klienter', () => {
    expect(klientIdentitet(`client:${A_SAELGER}`)).toBe(A_SAELGER);
    expect(klientIdentitet('client:<Client>hack</Client>')).toBeNull();
    expect(klientIdentitet('+4511111111')).toBeNull();
  });
  it('mock er default; kun TWILIO_MOCK=0 slår rigtige køb til', () => {
    expect(erMock(() => undefined)).toBe(true);
    expect(erMock(() => '1')).toBe(true);
    expect(erMock(() => '0')).toBe(false);
    expect(erMock(() => 'false')).toBe(false);
  });
});

describe('indgående opkald', () => {
  it('opkald til firma A når KUN A\'s godkendte brugere', async () => {
    const r = await routOpkald({ To: NR_A, From: '+4511111111' }, falskDb());
    expect(r).toEqual({ type: 'indgaaende', nummer: NR_A, fra: '+4511111111', klienter: [A_ADMIN, A_SAELGER] });
    const xml = routingTilTwiml(r);
    expect(xml).toContain(`<Client>${A_ADMIN}</Client>`);
    expect(xml).toContain(`<Client>${A_SAELGER}</Client>`);
    expect(xml).not.toContain(B_SAELGER);
    expect(xml).not.toContain('a00000a2');
  });
  it('opkald til firma B når kun B', async () => {
    const r = await routOpkald({ To: NR_B, From: '+4522222222' }, falskDb());
    expect(r.type === 'indgaaende' && r.klienter).toEqual([B_SAELGER]);
  });
  it('ukendt nummer ringer ingen op', async () => {
    const r = await routOpkald({ To: '+4599999999', From: '+4511111111' }, falskDb());
    expect(r).toEqual({ type: 'afvis', grund: 'ingen_brugere' });
    expect(routingTilTwiml(r)).not.toContain('<Client>');
  });
});

describe('udgående opkald', () => {
  it('bruger firmaets eget nummer som caller-id', async () => {
    const a = await routOpkald({ To: '22 22 22 22', From: `client:${A_SAELGER}` }, falskDb());
    expect(a).toMatchObject({ type: 'udgaaende', callerId: NR_A, til: '+4522222222' });
    const b = await routOpkald({ To: '+4511111111', From: `client:${B_SAELGER}` }, falskDb());
    expect(b).toMatchObject({ type: 'udgaaende', callerId: NR_B });
    expect(routingTilTwiml(b)).toContain(`callerId="${NR_B}"`);
  });
  it('ikke-godkendt sælger kan ikke ringe ud', async () => {
    const r = await routOpkald({ To: '+4511111111', From: 'client:a00000a2-0000-0000-0000-000000000000' }, falskDb());
    expect(r).toEqual({ type: 'afvis', grund: 'intet_firmanummer' });
  });
  it('escaper XML i nummeret', async () => {
    const r = await routOpkald({ To: '<Play>x</Play>', From: `client:${A_SAELGER}` }, falskDb());
    expect(r).toEqual({ type: 'afvis', grund: 'ugyldigt_nummer' });
  });
});

describe('Twilio-signatur', () => {
  it('godkender korrekt signatur og afviser forkert', async () => {
    const url = 'https://x.supabase.co/functions/v1/twilio-voice';
    const p = { To: NR_A, From: '+4511111111', CallSid: 'CA123' };
    const sig = await twilioSignatur('hemmelig', url, p);
    expect(await gyldigTwilioSignatur('hemmelig', url, p, sig)).toBe(true);
    expect(await gyldigTwilioSignatur('hemmelig', url, { ...p, To: NR_B }, sig)).toBe(false);
    expect(await gyldigTwilioSignatur('hemmelig', url, p, null)).toBe(false);
    expect(await gyldigTwilioSignatur(undefined, url, p, null)).toBe(true); // mock/lokal
  });
});

function falskeDeps(env: Record<string, string>, fetchMock = vi.fn()) {
  const raekker: NummerRaekke[] = [];
  const deps: OpretDeps = {
    env: (n) => env[n],
    fetch: fetchMock as unknown as typeof fetch,
    db: {
      firmaFindes: async (o) => o === ORG_A || o === ORG_B,
      firmaHarNummer: async (o) => raekker.some((r) => r.organisation_id === o),
      nummerFindes: async (n) => raekker.some((r) => r.nummer === n),
      indsaet: async (r) => { const ny = { id: `id-${raekker.length + 1}`, ...r }; raekker.push(ny); return ny; },
    },
  };
  return { deps, raekker, fetchMock };
}

describe('dialer-nummer-opret', () => {
  const env = { SUPABASE_URL: 'https://x.supabase.co' };

  it('mock (default): opretter falsk nummer uden at kalde Twilio', async () => {
    const { deps, raekker, fetchMock } = falskeDeps(env);
    const svar = await opretNummer({ organisation_id: ORG_A }, deps);
    expect(svar.status).toBe(200);
    expect(svar.body).toMatchObject({ ok: true, mock: true, handling: 'koeb',
      webhooks: { voice: 'https://x.supabase.co/functions/v1/twilio-voice', sms: 'https://x.supabase.co/functions/v1/twilio-sms' } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(raekker[0].nummer).toMatch(/^\+457899\d{4}$/);
    expect(raekker[0].twilio_number_sid).toMatch(/^PN[0-9a-f]{32}$/);
    expect(raekker[0]).toMatchObject({ organisation_id: ORG_A, mock: true, primaer: true });
    expect((svar.body.viderestilling as { kode: string }).kode).toBe(`*21*${raekker[0].nummer}#`);
  });

  it('firma B får sit eget nummer; andet nummer til A kræver "ekstra"', async () => {
    const { deps, raekker } = falskeDeps(env);
    await opretNummer({ organisation_id: ORG_A }, deps);
    const b = await opretNummer({ organisation_id: ORG_B }, deps);
    expect(b.status).toBe(200);
    expect(raekker.map((r) => r.organisation_id)).toEqual([ORG_A, ORG_B]);
    expect(raekker[0].nummer).not.toBe(raekker[1].nummer);
    expect((await opretNummer({ organisation_id: ORG_A }, deps)).status).toBe(409);
    const ekstra = await opretNummer({ organisation_id: ORG_A, ekstra: true }, deps);
    expect(ekstra.status).toBe(200);
    expect(raekker[2]).toMatchObject({ organisation_id: ORG_A, primaer: false, navn: 'Ekstra nummer' });
  });

  it('tilknyt (mock): registrerer et eksisterende nummer; samme nummer kan ikke tilknyttes to firmaer', async () => {
    const { deps, fetchMock } = falskeDeps(env);
    const a = await opretNummer({ organisation_id: ORG_A, handling: 'tilknyt', nummer: '70 00 00 01' }, deps);
    expect(a.status).toBe(200);
    expect((a.body.telefonnummer as NummerRaekke).nummer).toBe(NR_A);
    expect((await opretNummer({ organisation_id: ORG_B, handling: 'tilknyt', nummer: NR_A }, deps)).status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('afviser ukendt firma og ugyldige felter', async () => {
    const { deps } = falskeDeps(env);
    expect((await opretNummer({ organisation_id: 'ikke-uuid' }, deps)).status).toBe(400);
    expect((await opretNummer({ organisation_id: 'c0000000-0000-0000-0000-00000000000c' }, deps)).status).toBe(404);
    expect((await opretNummer({ organisation_id: ORG_A, indeholder: '12a' }, deps)).status).toBe(400);
    expect((await opretNummer({ organisation_id: ORG_A, handling: 'tilknyt', nummer: 'abc' }, deps)).status).toBe(400);
  });

  it('rigtig tilstand (TWILIO_MOCK=0): søger DK-nummer, køber med webhooks (falsk fetch — intet købes)', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('AvailablePhoneNumbers/DK/Local.json')) {
        return new Response(JSON.stringify({ available_phone_numbers: [{ phone_number: '+4570707070' }] }));
      }
      if (url.endsWith('IncomingPhoneNumbers.json') && init?.method === 'POST') {
        const b = new URLSearchParams(String(init.body));
        expect(b.get('PhoneNumber')).toBe('+4570707070');
        expect(b.get('VoiceUrl')).toBe('https://x.supabase.co/functions/v1/twilio-voice');
        expect(b.get('SmsUrl')).toBe('https://x.supabase.co/functions/v1/twilio-sms');
        expect(b.get('BundleSid')).toBe('BU123');
        return new Response(JSON.stringify({ sid: 'PN' + 'c'.repeat(32), phone_number: '+4570707070' }));
      }
      return new Response('{}', { status: 404 });
    });
    const { deps, raekker } = falskeDeps(
      { ...env, TWILIO_MOCK: '0', TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 't', TWILIO_DK_BUNDLE_SID: 'BU123' }, fetchMock);
    const svar = await opretNummer({ organisation_id: ORG_B, indeholder: '7070' }, deps);
    expect(svar.status).toBe(200);
    expect(svar.body.mock).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('Contains=7070');
    expect(raekker[0]).toMatchObject({ organisation_id: ORG_B, nummer: '+4570707070', mock: false });
  });

  it('rigtig tilstand uden nøgler giver 502, ikke et halvt nummer', async () => {
    const { deps, raekker } = falskeDeps({ ...env, TWILIO_MOCK: '0' });
    const svar = await opretNummer({ organisation_id: ORG_A }, deps);
    expect(svar.status).toBe(502);
    expect(raekker).toHaveLength(0);
  });
});

describe('viderestilling', () => {
  it('giver generisk *21*-kode og note om teleselskaber', () => {
    const v = viderestilling(NR_A);
    expect(v.kode).toBe('*21*+4570000001#');
    expect(v.annuller).toBe('##21#');
    expect(v.tekst).toMatch(/teleselskab/);
  });
});
