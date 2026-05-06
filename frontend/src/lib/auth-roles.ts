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
  console.log('[auth-roles] 🔍 Resolving user data for userId:', userId);

  // ---------- PRIMARY: public.user_roles ----------
  console.log('[auth-roles] → Querying public.user_roles WHERE user_id =', userId);
  const userRolesRes = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  console.log('[auth-roles] ← public.user_roles raw response:', {
    data: userRolesRes.data,
    error: userRolesRes.error,
    status: userRolesRes.status,
    statusText: userRolesRes.statusText,
    count: userRolesRes.data?.length ?? 0,
  });

  if (userRolesRes.error) {
    console.warn('[auth-roles] ⚠️ user_roles query FAILED:', userRolesRes.error.message);
  }

  let role: UserRole | null = null;
  let roleSource: 'user_roles' | 'medarbejdere' | 'none' = 'none';

  const roleRows = userRolesRes.data;
  if (roleRows && roleRows.length > 0) {
    console.log('[auth-roles] All roles found in user_roles:',
      roleRows.map((r: { role: string }) => `"${r.role}" (typeof=${typeof r.role})`));

    // Prefer admin/kontor over other roles if multiple exist.
    const adminRow = roleRows.find((r: { role: string }) => isAdminRole(r.role));
    role = (adminRow?.role ?? roleRows[0].role) as UserRole;
    roleSource = 'user_roles';
    console.log('[auth-roles] ✓ Picked role from user_roles:', JSON.stringify(role),
      `(adminRow found: ${!!adminRow})`);
  } else {
    console.log('[auth-roles] ✗ No rows in user_roles — will try fallback');
  }

  // ---------- Fetch medarbejder for navn/email/aktiv + fallback role ----------
  console.log('[auth-roles] → Querying business.medarbejdere WHERE auth_user_id =', userId);
  const medRes = await supabase
    .schema('business')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('medarbejdere' as any)
    .select('navn, email, login_rolle, aktiv')
    .eq('auth_user_id', userId)
    .maybeSingle();

  console.log('[auth-roles] ← business.medarbejdere raw response:', {
    data: medRes.data,
    error: medRes.error,
    status: medRes.status,
    statusText: medRes.statusText,
  });

  if (medRes.error) {
    console.warn('[auth-roles] ⚠️ medarbejdere query FAILED:', medRes.error.message);
  }

  const medarb = medRes.data as
    | { navn?: string; email?: string; login_rolle?: string; aktiv?: boolean }
    | null;

  // FALLBACK: medarbejdere.login_rolle
  if (!role && medarb?.login_rolle) {
    role = medarb.login_rolle as UserRole;
    roleSource = 'medarbejdere';
    console.log('[auth-roles] ✓ FALLBACK used — role from medarbejdere.login_rolle:',
      JSON.stringify(role));
  }

  const finalRole = role;
  const adminCheck = isAdminRole(finalRole);

  console.log('[auth-roles] 📋 FINAL RESULT:', {
    userId,
    role: finalRole,
    roleType: typeof finalRole,
    roleSource,
    isAdminRole: adminCheck,
    ADMIN_ROLES: Array.from(ADMIN_ROLES),
    navn: medarb?.navn ?? '(none)',
    email: medarb?.email ?? '(none)',
    aktiv: medarb?.aktiv ?? '(none)',
  });

  return {
    role: finalRole,
    navn: (medarb?.navn as string) ?? '',
    email: (medarb?.email as string) ?? '',
    aktiv: (medarb?.aktiv as boolean) ?? true,
  };
}
