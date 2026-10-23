/**
 * Hvor ligger Dialerens tabeller? (multi-tenant, 23. okt 2026)
 *
 * VITE_DIALER_DB=faelles → ASA Industries' fælles database: schema "dialer" med organisation_id + RLS, som appen når via
 *   genvejene public.dialer_<tabel> (migration 20261023130000 i asa-industries-db). Hvert firma ser kun sine egne rækker.
 * Ikke sat → som i dag (tabelnavne uden præfiks), så intet ændrer sig, før Jonas flytter Dialer over.
 */
export const DIALER_FAELLES_DB = import.meta.env.VITE_DIALER_DB === 'faelles';

export type DialerTabel =
  | 'profiles' | 'user_roles' | 'campaigns' | 'campaign_users' | 'leads' | 'products' | 'call_logs'
  | 'tetris_scores' | 'telefonnumre' | 'sms';

export function tabel(navn: DialerTabel): string {
  return DIALER_FAELLES_DB ? `dialer_${navn}` : navn;
}
