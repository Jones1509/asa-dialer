/* ============================================================================
 * BACKEND STUB — Supabase-shaped placeholder
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Dette er en midlertidig erstatning for den oprindelige Supabase-klient
 * (`@/lib/backend-stub`). Den har samme API-overflade som Supabase
 * (auth + from().select/insert/update/delete/eq/in/order/single/limit), men
 * gemmer INTET i en rigtig database. Alt kører lokalt i hukommelsen +
 * localStorage, så UI'et kan starte, logge ind og navigere uden backend.
 *
 * INTET ægte opkald sker endnu — Twilio-koden (useTwilioDevice.ts) forsøger
 * stadig at kalde Supabase Edge Functions, men fejler silent når stubben er
 * aktiv. Det er helt ok indtil rigtig backend kobles på.
 *
 * LOGIN-REGLER (kun stub)
 * -----------------------
 * - Alle email/password-kombinationer accepteres.
 * - Hvis email indeholder "admin" eller "kontor" → brugeren får admin-rolle.
 * - Brugere er ALTID approved + active i stub-mode.
 *
 * SÅDAN KOBLES DET TIL RIGTIG BACKEND SENERE
 * ------------------------------------------
 * Når du er klar til at forbinde dit nye Supabase-projekt + Twilio:
 *
 *   1. Opret et nyt Supabase-projekt på https://supabase.com/dashboard
 *   2. Kør SQL-migrations fra `frontend/supabase/migrations/` i dit
 *      nye projekt (SQL Editor → paste → run, i filrækkefølge).
 *   3. Deploy edge functions fra `frontend/supabase/functions/`:
 *         supabase functions deploy twilio-token
 *         supabase functions deploy twilio-voice
 *         supabase functions deploy setup-admin
 *   4. Sæt Twilio secrets i Supabase:
 *         TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY,
 *         TWILIO_API_SECRET, TWILIO_TWIML_APP_SID, TWILIO_PHONE_NUMBER
 *   5. Læg nye credentials i `frontend/.env`:
 *         VITE_SUPABASE_PROJECT_ID="xxx"
 *         VITE_SUPABASE_URL="https://xxx.supabase.co"
 *         VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
 *   6. SLET denne fil (`src/lib/backend-stub.ts`).
 *   7. Genopret `src/integrations/supabase/client.ts` med:
 *         import { createClient } from '@supabase/supabase-js';
 *         export const supabase = createClient(
 *           import.meta.env.VITE_SUPABASE_URL,
 *           import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
 *           { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } }
 *         );
 *   8. Find/erstat i hele projektet:
 *         '@/lib/backend-stub'  →  '@/lib/backend-stub'
 *   9. Fjern det gule "Backend skal opsættes"-banner fra `src/pages/Index.tsx`.
 *  10. Twilio klar: useTwilioDevice henter nu rigtige tokens fra edge function.
 *
 * ============================================================================ */

// --- Minimal types (matcher @supabase/supabase-js overfladen vi bruger) ---
export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at?: number;
}

type AuthEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'PASSWORD_RECOVERY'
  | 'USER_UPDATED';

type AuthCallback = (event: AuthEvent, session: Session | null) => void;

// --- In-memory/localStorage session management ---
const STORAGE_KEY = 'asa-dialer-stub-session';
const listeners = new Set<AuthCallback>();

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* noop */
  }
}

function emit(event: AuthEvent, session: Session | null) {
  listeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch (e) {
      console.error('[backend-stub] listener error:', e);
    }
  });
}

function isAdminEmail(email: string): boolean {
  const e = (email || '').toLowerCase();
  return e.includes('admin') || e.includes('kontor');
}

function makeSessionForEmail(email: string): Session {
  const userId = `stub-${btoa(email).replace(/=/g, '')}`;
  return {
    access_token: `stub-token-${userId}`,
    refresh_token: `stub-refresh-${userId}`,
    user: {
      id: userId,
      email,
      user_metadata: { full_name: email.split('@')[0] || 'Stub User' },
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
  };
}

// --- Auth surface ---
const auth = {
  async signInWithPassword({ email, password: _password }: { email: string; password: string }) {
    if (!email) {
      return {
        data: { user: null, session: null },
        error: { message: 'Email is required' },
      };
    }
    const session = makeSessionForEmail(email);
    saveSession(session);
    emit('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },

  async signUp({ email, password: _password, options }: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
  }) {
    if (!email) {
      return {
        data: { user: null, session: null },
        error: { message: 'Email is required' },
      };
    }
    const session = makeSessionForEmail(email);
    if (options?.data) {
      session.user.user_metadata = { ...session.user.user_metadata, ...options.data };
    }
    saveSession(session);
    emit('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },

  async signOut() {
    saveSession(null);
    emit('SIGNED_OUT', null);
    return { error: null };
  },

  async getUser() {
    const session = loadSession();
    return { data: { user: session?.user ?? null }, error: null };
  },

  async getSession() {
    const session = loadSession();
    return { data: { session }, error: null };
  },

  async updateUser(_attrs: { password?: string; data?: Record<string, unknown> }) {
    const session = loadSession();
    if (!session) {
      return { data: { user: null }, error: { message: 'No active session' } };
    }
    emit('USER_UPDATED', session);
    return { data: { user: session.user }, error: null };
  },

  async resetPasswordForEmail(_email: string, _opts?: { redirectTo?: string }) {
    // Pretend we sent a reset e-mail.
    return { data: {}, error: null };
  },

  onAuthStateChange(callback: AuthCallback) {
    listeners.add(callback);
    // Fire initial session once so consumers don't hang in "loading".
    setTimeout(() => {
      const session = loadSession();
      try {
        callback('INITIAL_SESSION', session);
      } catch (e) {
        console.error('[backend-stub] onAuthStateChange initial error:', e);
      }
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        },
      },
    };
  },
};

// --- Query builder stub (chainable, returns empty data gracefully) ---
type FilterOp = 'eq' | 'in' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';

interface QueryState {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete';
  payload?: unknown;
  filters: Array<{ op: FilterOp; col: string; val: unknown }>;
  _single?: boolean;
  _maybeSingle?: boolean;
  _countOnly?: boolean;
  _headOnly?: boolean;
}

type StubResult<T = unknown> = {
  data: T;
  error: null | { message: string };
  count?: number | null;
};

function makeQuery(table: string): QueryBuilder {
  const state: QueryState = { table, action: 'select', filters: [] };
  return buildBuilder(state);
}

interface QueryBuilder extends PromiseLike<StubResult<unknown[]>> {
  select: (cols?: string, opts?: { count?: string; head?: boolean }) => QueryBuilder;
  insert: (payload: unknown) => QueryBuilder;
  update: (payload: unknown) => QueryBuilder;
  delete: () => QueryBuilder;
  eq: (col: string, val: unknown) => QueryBuilder;
  neq: (col: string, val: unknown) => QueryBuilder;
  in: (col: string, vals: unknown[]) => QueryBuilder;
  gt: (col: string, val: unknown) => QueryBuilder;
  lt: (col: string, val: unknown) => QueryBuilder;
  gte: (col: string, val: unknown) => QueryBuilder;
  lte: (col: string, val: unknown) => QueryBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => QueryBuilder;
  limit: (n: number) => QueryBuilder;
  single: () => QueryBuilder;
  maybeSingle: () => QueryBuilder;
}

function buildBuilder(state: QueryState): QueryBuilder {
  const exec = async (): Promise<StubResult<unknown>> => {
    // Stub returns empty arrays for selects, and success for writes.
    if (state.action === 'select') {
      if (state._countOnly || state._headOnly) {
        return { data: null, error: null, count: 0 };
      }
      if (state._single) {
        return { data: null, error: null };
      }
      if (state._maybeSingle) {
        return { data: null, error: null };
      }
      return { data: [], error: null, count: 0 };
    }
    if (state.action === 'insert') {
      // If .select().single() is chained after insert, return a fake row.
      if (state._single) {
        const fake = Array.isArray(state.payload)
          ? (state.payload as unknown[])[0]
          : state.payload;
        return { data: { id: `stub-${Date.now()}`, ...(fake as object) }, error: null };
      }
      return { data: null, error: null };
    }
    // update / delete
    return { data: null, error: null };
  };

  const builder: QueryBuilder = {
    select(_cols, opts) {
      if (opts?.count) state._countOnly = true;
      if (opts?.head) state._headOnly = true;
      // select after insert/update is fine — keep action.
      if (state.action !== 'insert' && state.action !== 'update' && state.action !== 'delete') {
        state.action = 'select';
      }
      return builder;
    },
    insert(payload) {
      state.action = 'insert';
      state.payload = payload;
      return builder;
    },
    update(payload) {
      state.action = 'update';
      state.payload = payload;
      return builder;
    },
    delete() {
      state.action = 'delete';
      return builder;
    },
    eq(col, val) { state.filters.push({ op: 'eq', col, val }); return builder; },
    neq(col, val) { state.filters.push({ op: 'neq', col, val }); return builder; },
    in(col, vals) { state.filters.push({ op: 'in', col, val: vals }); return builder; },
    gt(col, val) { state.filters.push({ op: 'gt', col, val }); return builder; },
    lt(col, val) { state.filters.push({ op: 'lt', col, val }); return builder; },
    gte(col, val) { state.filters.push({ op: 'gte', col, val }); return builder; },
    lte(col, val) { state.filters.push({ op: 'lte', col, val }); return builder; },
    order(_col, _opts) { return builder; },
    limit(_n) { return builder; },
    single() { state._single = true; return builder; },
    maybeSingle() { state._maybeSingle = true; return builder; },
    then(onFulfilled, onRejected) {
      return exec().then(onFulfilled as never, onRejected);
    },
  };

  return builder;
}

// --- Functions surface (Supabase edge functions stub) ---
const functions = {
  async invoke<T = unknown>(
    _name: string,
    _opts?: { body?: unknown; headers?: Record<string, string> },
  ): Promise<{ data: T | null; error: { message: string } | null }> {
    return { data: null, error: { message: 'Backend not configured (stub)' } };
  },
};

// --- Exported client ---
export const supabase = {
  auth,
  from: (table: string) => makeQuery(table),
  functions,
};

export default supabase;
