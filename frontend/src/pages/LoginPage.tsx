import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveUserData, isAdminRole } from '@/lib/auth-roles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { User, Shield, Mail, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';

import asaDialerLogo from '@/assets/asa-dialer-logo.svg';
import asaDialerWordmark from '@/assets/wordmark-asa-dialer.png';

// 1-til-1 kopi af kls.asa-el.dk/login — kun logo, ordmærke og undertitel skifter.
// Poppins (brødtekst) + Montserrat (undertitel) som KLS, indlæst via index.html.
const KLS = {
  bg: 'radial-gradient(ellipse at 60% 10%, hsl(209 63% 25% / 0.6), transparent 50%), radial-gradient(ellipse at 30% 90%, hsl(205 62% 18% / 0.5), transparent 50%), hsl(205 62% 8%)',
  font: "'Poppins', sans-serif",
  heading: "'Montserrat', sans-serif",
};
const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
const INPUT = 'w-full px-4 py-3 rounded-xl text-[16px] leading-5 sm:text-sm outline-none transition-all duration-200 bg-white/[0.06] text-white border border-white/[0.08] placeholder:text-white/20 focus:border-[hsl(208_62%_49%)] focus:bg-white/[0.1]';
const INPUT_RESET = 'w-full px-5 py-4 rounded-xl text-[16px] leading-5 sm:text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-[hsl(208_62%_49%)] focus:bg-white/[0.12]';
const KNAP = 'py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 border-none bg-[hsl(209_63%_49%)] text-white shadow-[0_4px_20px_hsl(209_63%_49%/0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_hsl(209_63%_49%/0.45)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0';
const PILLE = 'flex min-h-[44px] items-center gap-2 px-5 py-2 rounded-full text-[12px] font-semibold transition-all duration-300 border';
const PILLE_AKTIV = 'bg-[hsl(209_63%_49%)] text-white border-[hsl(209_63%_49%)] shadow-[0_4px_14px_hsl(209_63%_49%/0.4)]';
const PILLE_INAKTIV = 'bg-transparent text-white/50 border-white/10 hover:border-white/25';

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

  // Mørk html/body-baggrund kun på login-ruten, så iOS-overscroll ikke viser en lys kant.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = 'hsl(205 62% 8%)';
    body.style.background = 'hsl(205 62% 8%)';
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);

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

    console.log('[LoginPage] 🚀 handleLogin start', {
      isAdminMode,
      tab: isAdminMode ? 'ADMIN' : 'BRUGER',
      email,
    });

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      console.warn('[LoginPage] ✗ signInWithPassword failed:', signInError.message);
      setError(signInError.message === 'Invalid login credentials'
        ? 'Forkert email eller adgangskode'
        : signInError.message);
      setLoading(false);
      return;
    }

    console.log('[LoginPage] ✓ signInWithPassword OK');

    // Hent bruger + resolve rolle (user_roles → fallback medarbejdere.login_rolle)
    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    if (!signedInUser) {
      console.error('[LoginPage] ✗ getUser returned null after successful sign-in');
      setError('Kunne ikke verificere bruger');
      setLoading(false);
      return;
    }

    console.log('[LoginPage] ✓ getUser OK — userId:', signedInUser.id, 'email:', signedInUser.email);

    const resolved = await resolveUserData(signedInUser.id);

    console.log('[LoginPage] 🧩 Resolved from auth-roles helper:', {
      role: resolved.role,
      roleType: typeof resolved.role,
      navn: resolved.navn,
      aktiv: resolved.aktiv,
    });

    if (!resolved.role) {
      console.error('[LoginPage] ✗ No role resolved — signing out');
      await supabase.auth.signOut();
      setError('Ingen rolle fundet for denne bruger – kontakt en administrator');
      setLoading(false);
      return;
    }

    const adminRole = isAdminRole(resolved.role);

    console.log('[LoginPage] 🎯 Role check:', {
      resolvedRole: resolved.role,
      isAdminRole: adminRole,
      isAdminMode,
      ADMIN_ROLES: ['admin', 'kontor'],
      decision: isAdminMode
        ? (adminRole ? '→ /admin' : '→ REJECT (admin tab, not admin role)')
        : (adminRole ? '→ REJECT (user tab, admin role)' : '→ /'),
    });

    if (isAdminMode) {
      if (!adminRole) {
        console.warn('[LoginPage] ✗ Admin tab but role is not admin/kontor:', JSON.stringify(resolved.role));
        await supabase.auth.signOut();
        setError('Du har ikke admin-adgang');
        setLoading(false);
        return;
      }
      console.log('[LoginPage] ✓ Admin login OK — navigating to /admin');
      setLoading(false);
      navigate('/admin');
    } else {
      // Bruger-tab: admin/kontor må IKKE logge ind her (streng adskillelse)
      if (adminRole) {
        console.warn('[LoginPage] ✗ User tab but role is admin/kontor — redirecting to admin tab');
        await supabase.auth.signOut();
        setError('Brug Admin-fanen til at logge ind');
        setLoading(false);
        return;
      }
      console.log('[LoginPage] ✓ User login OK — navigating to /');
      setLoading(false);
      navigate('/');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Indtast din email-adresse');
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
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ background: KLS.bg, fontFamily: KLS.font }}
    >
      {/* Subtle grain overlay */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: GRAIN }} />

      {/* Soft glow behind card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(209 63% 49% / 0.06), transparent 70%)' }}
      />

      <div className="w-full max-w-[480px] relative z-10 flex flex-col items-center">
        {/* ▲ Apex: Logo icon */}
        <img src={asaDialerLogo} alt="ASA Dialer" className="h-32 w-auto mb-2" />

        {/* Text logo */}
        <img src={asaDialerWordmark} alt="ASA Dialer" className="h-[18px] w-auto mb-2.5" />

        {/* Subtitle */}
        <div className="font-semibold text-[9px] tracking-[0.35em] uppercase text-white/35 mb-6" style={{ fontFamily: KLS.heading }}>
          Kundekontakt
        </div>

        {resetMode ? (
          <div className="w-[85%] flex flex-col items-center gap-5">
            <h1 className="font-extrabold text-3xl tracking-tight text-center mb-1 text-white" style={{ fontFamily: KLS.heading }}>
              Nulstil adgangskode
            </h1>
            {resetSent ? (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center">
                  <Mail size={24} className="text-success" />
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Vi har sendt et link til{' '}
                  <strong className="text-white/70">{email}</strong>.<br />
                  Tjek din indbakke og klik på linket for at nulstille din adgangskode.
                </p>
                <button onClick={() => { setResetMode(false); setResetSent(false); }}
                  className="text-[hsl(209_63%_49%)] text-sm font-semibold bg-transparent border-none cursor-pointer hover:underline">
                  Tilbage til login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-5">
                <p className="text-center text-sm text-white/40">
                  Indtast din email-adresse og vi sender dig et link til at nulstille din adgangskode.
                </p>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="din@email.dk" required className={INPUT_RESET} />
                  <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25" />
                </div>
                {error && (
                  <div className="text-sm rounded-xl px-4 py-3 bg-destructive/15 text-destructive/80 border border-destructive/20">{error}</div>
                )}
                <button type="submit" disabled={loading} className={`${KNAP} w-full py-4`}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Sender...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><KeyRound size={16} />Send nulstillingslink</span>
                  )}
                </button>
                <button type="button" onClick={() => { setResetMode(false); setError(''); }}
                  className="text-center text-sm text-white/40 bg-transparent border-none cursor-pointer hover:text-white/60 transition-colors">
                  Tilbage til login
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ▲ Triangle login flow */
          <div className="w-full flex flex-col items-center">
            {/* Bruger / Admin (Admin = admin/kontor-roller) — KLS-pillestil */}
            <div className="flex justify-center gap-2.5 mb-4">
              <button
                onClick={() => { setIsAdminMode(false); setError(''); }}
                className={`${PILLE} ${!isAdminMode ? PILLE_AKTIV : PILLE_INAKTIV}`}
              >
                <User size={13} strokeWidth={2} />
                Bruger
              </button>
              <button
                onClick={() => { setIsAdminMode(true); setError(''); }}
                className={`${PILLE} ${isAdminMode ? PILLE_AKTIV : PILLE_INAKTIV}`}
              >
                <Shield size={13} strokeWidth={2} />
                Admin
              </button>
            </div>

            <p className="text-center text-[11px] mb-4 text-white/30">
              {isAdminMode ? 'Log ind med din administrator-konto' : 'Log ind med dine oplysninger'}
            </p>

            <form onSubmit={handleLogin} className="w-full flex flex-col items-center gap-3.5">
              <div className="relative w-[72%]">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="din@email.dk" required className={INPUT} />
                <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              </div>

              <div className="relative w-[82%]">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className={INPUT} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center bg-transparent border-none cursor-pointer text-white/20 hover:text-white/45 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {error && (
                <div className="w-[92%] text-sm rounded-xl px-4 py-3 bg-destructive/15 text-destructive/80 border border-destructive/20">{error}</div>
              )}

              {/* Login button — widest: 92% */}
              <button type="submit" disabled={loading} className={`${KNAP} w-[92%] mt-1`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Logger ind...
                  </span>
                ) : 'Log ind'}
              </button>
            </form>

            {/* Base */}
            <p className="text-center text-[11px] mt-1">
              <button
                onClick={() => { setResetMode(true); setError(''); }}
                className="px-2 py-3 text-white/55 bg-transparent border-none cursor-pointer hover:text-white/80 transition-colors text-[11px]">
                Glemt din adgangskode?
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
