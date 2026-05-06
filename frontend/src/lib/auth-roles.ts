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

export type UserRole = 'admin' | 'kontor' | string;

export interface ResolvedUserData {
  role: UserRole | null;
  navn: string;
  email: string;
  aktiv: boolean;
}

export const ADMIN_ROLES = new Set(['admin', 'kontor']);

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

/**
 * Resolve role + name + active status for a user.
 *
 * 1. Try public.user_roles (PRIMARY)
 * 2. Fallback til business.medarbejdere.login_rolle
 * 3. Hent altid navn/email/aktiv fra business.medarbejdere
 */
export async function resolveUserData(userId: string): Promise<ResolvedUserData> {
  // PRIMARY: public.user_roles
  const { data: roleRows, error: roleErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (roleErr) {
    console.warn('[auth] user_roles query failed:', roleErr.message);
  }

  let role: UserRole | null = null;
  if (roleRows && roleRows.length > 0) {
    // Prefer admin/kontor over other roles if multiple exist.
    const adminRow = roleRows.find((r: { role: string }) => isAdminRole(r.role));
    role = (adminRow?.role ?? roleRows[0].role) as UserRole;
  }

  // Fetch medarbejder for navn/email/aktiv + fallback rolle
  const { data: medarb, error: medErr } = await supabase
    .schema('business')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('medarbejdere' as any)
    .select('navn, email, login_rolle, aktiv')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (medErr) {
    console.warn('[auth] medarbejdere query failed:', medErr.message);
  }

  // FALLBACK: medarbejdere.login_rolle
  if (!role && medarb?.login_rolle) {
    role = medarb.login_rolle as UserRole;
  }

  return {
    role,
    navn: (medarb?.navn as string) ?? '',
    email: (medarb?.email as string) ?? '',
    aktiv: (medarb?.aktiv as boolean) ?? true,
  };
}
