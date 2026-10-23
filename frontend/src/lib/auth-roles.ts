/**
 * Auth role resolution helpers.
 *
 * DATABASE STRUKTUR
 * -----------------
 * - public.user_roles (user_id uuid, role text/enum, tenant_id uuid)   ← PRIMÆR rolle-kilde
 * - business.medarbejdere (auth_user_id uuid, navn text, email text,
 *     login_rolle enum, aktiv boolean, stilling enum)                  ← navn + fallback rolle
 *
 * Bemærk: For at queries mod `business.medarbejdere` virker, skal `business`
 * være eksponeret i Supabase Dashboard → Project Settings → API → Exposed schemas.
 */
import { supabase } from '@/lib/supabase';
import { tabel, DIALER_FAELLES_DB } from '@/lib/dialer-db';

export type UserRole = 'admin' | 'kontor' | string;

export interface ResolvedUserData {
  role: UserRole | null;
  navn: string;
  email: string;
  aktiv: boolean;
}

export const ADMIN_ROLES = new Set(['admin', 'kontor']);

/**
 * Tjekker om rolle er admin/kontor. Trimmer + lowercases for at være robust
 * over for enum-værdier med whitespace eller blandede cases.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase();
  return ADMIN_ROLES.has(normalized);
}

/**
 * Resolve role + name + active status for a user.
 *
 * 1. Try public.user_roles (PRIMARY)
 * 2. Fallback til business.medarbejdere.login_rolle
 * 3. Hent altid navn/email/aktiv fra business.medarbejdere
 *
 * Bemærk: 'aktiv'-status returneres KUN som info — vi filtrerer ALDRIG på den
 * når vi finder rollen, så et inaktivt medlem stadig får sin korrekte rolle
 * tilbage og kan håndteres af kaldende kode.
 */
export async function resolveUserData(userId: string): Promise<ResolvedUserData> {
  if (DIALER_FAELLES_DB) return resolveFaellesUserData(userId);

  // ---------- PRIMARY: public.user_roles ----------
  const userRolesRes = await supabase
    .from(tabel('user_roles'))
    .select('role')
    .eq('user_id', userId);


  if (userRolesRes.error) {
    console.warn('[auth-roles] ⚠️ user_roles query FAILED:', userRolesRes.error.message);
  }

  let role: UserRole | null = null;

  const roleRows = userRolesRes.data;
  if (roleRows && roleRows.length > 0) {
    // Prefer admin/kontor over other roles if multiple exist.
    const adminRow = roleRows.find((r: { role: string }) => isAdminRole(r.role));
    role = (adminRow?.role ?? roleRows[0].role) as UserRole;
  }

  // ---------- Fetch medarbejder for navn/email/aktiv + fallback role ----------
  const medRes = await supabase
    .schema('business')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('medarbejdere' as any)
    .select('navn, email, login_rolle, aktiv')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (medRes.error) {
    console.warn('[auth-roles] ⚠️ medarbejdere query FAILED:', medRes.error.message);
  }

  const medarb = medRes.data as
    | { navn?: string; email?: string; login_rolle?: string; aktiv?: boolean }
    | null;

  // FALLBACK: medarbejdere.login_rolle
  if (!role && medarb?.login_rolle) {
    role = medarb.login_rolle as UserRole;
  }

  const finalRole = role;

  return {
    role: finalRole,
    navn: (medarb?.navn as string) ?? '',
    email: (medarb?.email as string) ?? '',
    aktiv: (medarb?.aktiv as boolean) ?? true,
  };
}

/**
 * Fælles database (VITE_DIALER_DB=faelles): rolle og status fra dialer_user_roles + dialer_profiles i brugerens eget firma
 * (RLS sørger for firmaet). Første login opretter en profil, der afventer godkendelse fra firmaets admin.
 */
async function resolveFaellesUserData(userId: string): Promise<ResolvedUserData> {
  const [{ data: roller }, { data: profil }] = await Promise.all([
    supabase.from(tabel('user_roles')).select('role').eq('user_id', userId),
    supabase.from(tabel('profiles')).select('full_name, email, approved, active').eq('user_id', userId).maybeSingle(),
  ]);

  let p = profil as { full_name: string; email: string; approved: boolean; active: boolean } | null;
  if (!p) {
    const { data: { user } } = await supabase.auth.getUser();
    const ny = { user_id: userId, full_name: (user?.user_metadata?.full_name as string) ?? '', email: user?.email ?? '' };
    const { error } = await supabase.from(tabel('profiles')).insert(ny);
    if (error) console.warn('[auth-roles] Kunne ikke oprette Dialer-profil:', error.message);
    p = { ...ny, approved: false, active: true };
  }

  const erAdmin = (roller ?? []).some((r: { role: string }) => r.role === 'admin');
  return {
    role: erAdmin ? 'admin' : 'user',
    navn: p.full_name,
    email: p.email,
    aktiv: p.approved && p.active,
  };
}
