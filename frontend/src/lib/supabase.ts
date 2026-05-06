/**
 * Supabase client (real backend connection).
 *
 * Bruger @supabase/supabase-js og environment variables fra .env.
 * Forventer at følgende variabler er sat:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Import således:
 *   import { supabase } from "@/lib/supabase";
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a clear error during dev if env vars are missing.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
