import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery session from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setValidSession(true);
    }

    // Also listen for auth state change with recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn');
      return;
    }
    if (password !== confirmPassword) {
      setError('Adgangskoderne matcher ikke');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 70% 20%, hsl(217 80% 20% / 0.7), transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(217 70% 15% / 0.6), transparent 60%), radial-gradient(ellipse at 90% 90%, hsl(220 60% 10% / 0.5), transparent 50%), hsl(220 20% 4%)',
      }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <span className="font-heading font-extrabold text-5xl tracking-tight text-primary">ASA</span>
          <div className="font-heading font-semibold text-sm tracking-[0.2em] uppercase text-primary/70">Dialer</div>
        </div>

        {success ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-success" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Adgangskode ændret</h1>
            <p className="text-white/40 text-sm">Du omdirigeres til login...</p>
          </div>
        ) : (
          <>
            <h1 className="font-heading font-extrabold text-3xl tracking-tight text-center mb-2 text-white">
              Ny adgangskode
            </h1>
            <p className="text-center text-sm mb-8 text-white/40">
              Indtast din nye adgangskode herunder
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-5">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ny adgangskode"
                  required
                  className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.12]"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-white/25 hover:text-white/50 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Bekræft adgangskode"
                required
                className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.12]"
              />

              {error && (
                <div className="text-sm rounded-xl px-4 py-3 bg-destructive/15 text-destructive/80 border border-destructive/20">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 border-none bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(217_91%_60%/0.4)] hover:-translate-y-0.5 disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Gemmer...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><KeyRound size={16} /> Gem ny adgangskode</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
