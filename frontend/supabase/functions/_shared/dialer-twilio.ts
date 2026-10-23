/**
 * Fælles Twilio-logik for Dialerens Edge-funktioner (multi-tenant, 23. okt 2026).
 *
 * Ren TypeScript uden Deno-API'er, så den både kører i Edge (Deno) og testes med vitest
 * (src/test/dialer-twilio.test.ts). Netværk og database sendes ind som parametre.
 *
 * Regler:
 *  - Indgående opkald/SMS: firmaet slås op ud fra det KALDTE nummer (Twilio "To"). Kun det firmas brugere ringes op.
 *  - Udgående: firmaets eget (primære) nummer bruges som caller-id. Intet nummer = opkaldet afvises.
 *  - Twilio-numre købes kun, når TWILIO_MOCK=0. Alt andet (også tom) = mock: intet købes, intet API-kald.
 */

export type Env = (navn: string) => string | undefined;

/** Mock er default. Kun den eksplicitte værdi "0" (eller "false") slår rigtige køb til. */
export function erMock(env: Env): boolean {
  const v = (env('TWILIO_MOCK') ?? '1').trim().toLowerCase();
  return !(v === '0' || v === 'false');
}

/** Dansk nummer → E.164 (+45XXXXXXXX). Andre +-numre bevares. Ugyldigt → null. */
export function normaliserNummer(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^\d{8}$/.test(s)) s = '+45' + s;
  if (/^45\d{8}$/.test(s)) s = '+' + s;
  return /^\+[1-9]\d{6,14}$/.test(s) ? s : null;
}

export function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Twilio Client-identitet er brugerens uuid. "client:<uuid>" → uuid. */
export function klientIdentitet(fra: string | null | undefined): string | null {
  if (!fra || !fra.startsWith('client:')) return null;
  const id = fra.slice('client:'.length);
  return UUID_RE.test(id) ? id : null;
}

const XML = '<?xml version="1.0" encoding="UTF-8"?>';

export function twimlSig(tekst: string): string {
  return `${XML}\n<Response>\n  <Say language="da-DK">${xmlEscape(tekst)}</Say>\n</Response>`;
}

export function twimlTom(): string {
  return `${XML}\n<Response></Response>`;
}

export function twimlUdgaaende(callerId: string, til: string): string {
  return `${XML}\n<Response>\n  <Dial callerId="${xmlEscape(callerId)}">\n    <Number>${xmlEscape(til)}</Number>\n  </Dial>\n</Response>`;
}

export function twimlIndgaaende(fra: string, klienter: string[]): string {
  const entries = klienter.map((id) => `    <Client>${xmlEscape(id)}</Client>`).join('\n');
  return `${XML}\n<Response>\n  <Dial callerId="${xmlEscape(fra)}" timeout="30">\n${entries}\n  </Dial>\n  <Say language="da-DK">Ingen svarede. Prøv igen senere.</Say>\n</Response>`;
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* Twilio-signatur (X-Twilio-Signature): HMAC-SHA1 af URL + sorterede POST-parametre, base64.                          */
/* ------------------------------------------------------------------------------------------------------------------ */

function base64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function twilioSignatur(authToken: string, url: string, params: Record<string, string>): Promise<string> {
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64(new Uint8Array(sig));
}

/** Sammenligner i konstant tid. Uden auth-token (mock/lokal) springes kontrollen over. */
export async function gyldigTwilioSignatur(
  authToken: string | undefined, url: string, params: Record<string, string>, signatur: string | null,
): Promise<boolean> {
  if (!authToken) return true;
  if (!signatur) return false;
  const forventet = await twilioSignatur(authToken, url, params);
  if (forventet.length !== signatur.length) return false;
  let diff = 0;
  for (let i = 0; i < forventet.length; i++) diff |= forventet.charCodeAt(i) ^ signatur.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* Routing: hvad skal der ske med et opkald? (DB-opslag sendes ind, så logikken kan testes uden database.)             */
/* ------------------------------------------------------------------------------------------------------------------ */

export interface RoutingDb {
  /** public.dialer_klienter_for_nummer: godkendte, aktive brugere i firmaet, der ejer nummeret */
  klienterForNummer(nummer: string): Promise<string[]>;
  /** public.dialer_callerid_for_bruger: firmaets primære nummer for en sælger (null = må ikke ringe ud) */
  callerIdForBruger(userId: string): Promise<string | null>;
}

export type Routing =
  | { type: 'udgaaende'; callerId: string; til: string; userId: string }
  | { type: 'indgaaende'; nummer: string; fra: string; klienter: string[] }
  | { type: 'afvis'; grund: 'ukendt_nummer' | 'ingen_brugere' | 'intet_firmanummer' | 'ugyldigt_nummer' };

export async function routOpkald(params: { To?: string; From?: string }, db: RoutingDb): Promise<Routing> {
  const til = params.To ?? '';
  const fra = params.From ?? '';
  const userId = klientIdentitet(fra);

  if (userId) {
    // UDGÅENDE: browser-klienten (sælgeren) ringer et nummer op → vis firmaets eget nummer
    const nummer = normaliserNummer(til);
    if (!nummer) return { type: 'afvis', grund: 'ugyldigt_nummer' };
    const callerId = await db.callerIdForBruger(userId);
    if (!callerId) return { type: 'afvis', grund: 'intet_firmanummer' };
    return { type: 'udgaaende', callerId, til: nummer, userId };
  }

  // INDGÅENDE: nogen ringer til et firmanummer → ring KUN det firmas brugere op
  const kaldt = normaliserNummer(til);
  if (!kaldt) return { type: 'afvis', grund: 'ukendt_nummer' };
  const klienter = await db.klienterForNummer(kaldt);
  if (klienter.length === 0) return { type: 'afvis', grund: 'ingen_brugere' };
  return { type: 'indgaaende', nummer: kaldt, fra, klienter };
}

export function routingTilTwiml(r: Routing): string {
  switch (r.type) {
    case 'udgaaende': return twimlUdgaaende(r.callerId, r.til);
    case 'indgaaende': return twimlIndgaaende(r.fra, r.klienter);
    case 'afvis':
      if (r.grund === 'ingen_brugere') return twimlSig('Der er ingen tilgængelige sælgere lige nu. Prøv igen senere.');
      if (r.grund === 'intet_firmanummer') return twimlSig('Dit firma har endnu ikke et telefonnummer i ASA Dialer.');
      if (r.grund === 'ugyldigt_nummer') return twimlSig('Nummeret er ugyldigt.');
      return twimlSig('Nummeret er ikke i brug.');
  }
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* Viderestilling (vises efter et nummer er oprettet)                                                                 */
/* ------------------------------------------------------------------------------------------------------------------ */

export function viderestilling(nummer: string) {
  const kode = `*21*${nummer}#`;
  return {
    kode,
    annuller: '##21#',
    tekst:
      `Sådan sender du opkald fra din mobil videre til dit nye ASA Dialer-nummer (${nummer}):\n` +
      `1. Åbn telefon-appen og tast ${kode}\n` +
      `2. Tryk på ring op. Du får en besked om, at viderestilling er slået til.\n` +
      `3. Vil du slå det fra igen, taster du ##21# og ringer op.\n\n` +
      `Vil du kun viderestille, når du ikke tager telefonen, så brug *61*${nummer}# (ubesvaret) eller *67*${nummer}# (optaget).\n` +
      `Bemærk: koderne virker hos de fleste danske teleselskaber, men det varierer. Virker det ikke, så slå ` +
      `viderestilling til i dit teleselskabs app eller selvbetjening, eller ring til deres kundeservice. ` +
      `Fastnet og omstillingsanlæg har ofte deres egen opsætning. Viderestillede opkald kan koste det samme som et ` +
      `almindeligt opkald hos dit teleselskab.`,
  };
}
