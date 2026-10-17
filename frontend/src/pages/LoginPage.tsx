import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveUserData, isAdminRole } from '@/lib/auth-roles';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { User, Shield, Mail, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';

import { AuthLayout, AuthTitle, AuthError } from '@/components/auth/AuthLayout';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, isApproved, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && !loading) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isApproved) {
        navigate('/', { replace: true });
      } else {
        navigate('/pending', { replace: true });
      }
    }
  }, [authLoading, user, isAdmin, isApproved, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Forkert email eller adgangskode. Tjek stavningen, eller nulstil din adgangskode.'
        : signInError.message);
      setLoading(false);
      return;
    }

    // Hent bruger + resolve rolle (user_roles → fallback medarbejdere.login_rolle)
    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    if (!signedInUser) {
      setError('Kunne ikke verificere brugeren. Prøv igen om et øjeblik.');
      setLoading(false);
      return;
    }

    const resolved = await resolveUserData(signedInUser.id);

    if (!resolved.role) {
      console.error('[LoginPage] No role resolved — signing out');
      await supabase.auth.signOut();
      setError('Din bruger har ingen rolle endnu. Kontakt en administrator.');
      setLoading(false);
      return;
    }

    const adminRole = isAdminRole(resolved.role);

    if (isAdminMode) {
      if (!adminRole) {
        await supabase.auth.signOut();
        setError('Du har ikke admin-adgang. Log ind under fanen Bruger.');
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate('/admin');
    } else {
      // Bruger-tab: admin/kontor må IKKE logge ind her (streng adskillelse)
      if (adminRole) {
        await supabase.auth.signOut();
        setError('Du er administrator — brug fanen Admin for at logge ind.');
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate('/');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Indtast din email-adresse, så sender vi et link.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
      setError('');
    }
  };

  return (
    <AuthLayout kort={false}>
      {resetMode ? (
        resetSent ? (
          <div className="mx-auto flex w-[96%] flex-col items-center gap-4 text-center sm:w-[92%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20">
              <Mail size={24} className="text-success" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white">Tjek din indbakke</h1>
            <p className="text-sm leading-relaxed text-white/70">
              Vi har sendt et link til <strong className="text-white">{email}</strong>. Klik på linket for at vælge en ny adgangskode.
            </p>
            <button type="button" onClick={() => { setResetMode(false); setResetSent(false); }} className="btn-primary w-full">
              Tilbage til login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="mx-auto flex w-[96%] flex-col gap-4 sm:w-[92%]" noValidate>
            <AuthTitle title="Nulstil adgangskode" text="Indtast din email, så sender vi dig et link til at vælge en ny adgangskode." />
            <div className="flex flex-col gap-2">
              <label htmlFor="reset-email" className="label-dark">Email</label>
              <input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="din@email.dk" required className="input-dark" />
            </div>
            {error && <AuthError message={error} />}
            <button type="submit" disabled={loading} className="btn-primary w-full min-h-12">
              {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />Sender…</> : <><KeyRound size={16} aria-hidden="true" />Send nulstillingslink</>}
            </button>
            <button type="button" onClick={() => { setResetMode(false); setError(''); }}
              className="btn-ghost w-full !text-white/70 hover:!bg-white/10 hover:!text-white">
              Tilbage til login
            </button>
          </form>
        )
      ) : (
        /* ▲ Trekant-flow: pill-toggle → e-mail 72 % → adgangskode 82 % → knap 92 % (som ASA-logoets trekant) */
        <div className="flex w-full flex-col items-center">
          <h1 className="sr-only">Log ind</h1>
          {/* Bruger / Admin (Admin = admin/kontor-roller) */}
          <div role="tablist" aria-label="Login-type" className="mb-4 flex justify-center gap-2.5">
            {[
              { admin: false, label: 'Bruger', Icon: User },
              { admin: true, label: 'Admin', Icon: Shield },
            ].map(({ admin, label, Icon }) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={isAdminMode === admin}
                onClick={() => { setIsAdminMode(admin); setError(''); }}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${isAdminMode === admin
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_4px_14px_hsl(var(--blue)/0.4)]'
                    : 'border-white/10 bg-transparent text-white/50 hover:border-white/25 hover:text-white/75'}`}
              >
                <Icon size={13} strokeWidth={2} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <p className="mb-4 text-center text-[11px] text-white/30">
            {isAdminMode ? 'Log ind med din administrator-konto' : 'Log ind med dine oplysninger'}
          </p>

          <form onSubmit={handleLogin} className="flex w-full flex-col items-center gap-3.5">
            <div className="relative w-[80%] sm:w-[72%]">
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input id="login-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="din@email.dk" required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.06] py-3 pl-4 pr-11 text-base text-white outline-none transition-colors duration-200 placeholder:text-white/25 focus:border-primary focus:bg-white/[0.1] sm:text-sm" />
              <Mail size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25" aria-hidden="true" />
            </div>

            <div className="relative w-[88%] sm:w-[82%]">
              <label htmlFor="login-password" className="sr-only">Adgangskode</label>
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.06] py-3 pl-4 pr-12 text-base text-white outline-none transition-colors duration-200 placeholder:text-white/25 focus:border-primary focus:bg-white/[0.1] sm:text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/30 transition-colors duration-150 hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>

            {error && <div className="w-[96%] sm:w-[92%]"><AuthError message={error} /></div>}

            <button type="submit" disabled={loading}
              className="mt-1 flex min-h-12 w-[96%] items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--blue)/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_hsl(var(--blue)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:hover:translate-y-0 sm:w-[92%]">
              {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />Logger ind…</> : 'Log ind'}
            </button>
          </form>

          <p className="mt-2 flex items-center justify-center gap-1 text-xs">
            <button type="button" onClick={() => { setResetMode(true); setError(''); }}
              className="min-h-11 rounded-lg px-2 text-white/55 transition-colors duration-150 hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Glemt din adgangskode?
            </button>
            <span className="text-white/25" aria-hidden="true">·</span>
            <Link to="/register"
              className="inline-flex min-h-11 items-center rounded-lg px-2 font-semibold text-brand-sky transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Opret konto
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
};

export default LoginPage;
