import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveUserData, isAdminRole } from '@/lib/auth-roles';
import { useNavigate } from 'react-router-dom';
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
    <AuthLayout>
      {resetMode ? (
        resetSent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20">
              <Mail size={24} className="text-success" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-white">Tjek din indbakke</h1>
            <p className="text-sm leading-relaxed text-white/70">
              Vi har sendt et link til <strong className="text-white">{email}</strong>. Klik på linket for at vælge en ny adgangskode.
            </p>
            <button type="button" onClick={() => { setResetMode(false); setResetSent(false); }} className="btn-primary w-full">
              Tilbage til login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4" noValidate>
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
        <div className="flex flex-col">
          {/* Bruger / Admin (Admin = admin/kontor-roller) */}
          <div role="tablist" aria-label="Login-type" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.06] p-1">
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
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors duration-150
                  ${isAdminMode === admin ? 'bg-primary text-primary-foreground shadow-sm' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <AuthTitle title="Log ind" text={isAdminMode ? 'Log ind med din administrator-konto' : 'Log ind med dine oplysninger'} />

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="label-dark">Email</label>
              <input id="login-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="din@email.dk" required className="input-dark" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="label-dark">Adgangskode</label>
                <button type="button" onClick={() => { setResetMode(true); setError(''); }}
                  className="-my-2 min-h-11 px-1 text-sm font-medium text-brand-sky transition-colors duration-150 hover:text-white">
                  Glemt adgangskode?
                </button>
              </div>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Din adgangskode" required className="input-dark pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
                  className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:text-white">
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && <AuthError message={error} />}

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full min-h-12">
              {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />Logger ind…</> : 'Log ind'}
            </button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
};

export default LoginPage;
