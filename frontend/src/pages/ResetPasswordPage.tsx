import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthLayout, AuthTitle, AuthError } from '@/components/auth/AuthLayout';

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
    <AuthLayout>
      {success ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20">
            <CheckCircle2 size={24} className="text-success" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Adgangskode ændret</h1>
          <p className="text-sm text-white/70">Du sendes videre til login om et øjeblik…</p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <AuthTitle title="Ny adgangskode" text="Vælg en ny adgangskode på mindst 6 tegn." />
          <div className="flex flex-col gap-2">
            <label htmlFor="new-pw" className="label-dark">Ny adgangskode</label>
            <div className="relative">
              <input
                id="new-pw"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mindst 6 tegn"
                required
                className="input-dark pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
                className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:text-white">
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-pw" className="label-dark">Gentag adgangskode</label>
            <input
              id="confirm-pw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Skriv den igen"
              required
              className="input-dark"
            />
          </div>

          {error && <AuthError message={error} />}

          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full min-h-12">
            {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Gemmer…</> : <><KeyRound size={16} aria-hidden="true" /> Gem ny adgangskode</>}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
