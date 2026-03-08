import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Forkert email eller adgangskode'
        : error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-heading font-extrabold text-xl text-primary-foreground mx-auto mb-4"
            style={{ boxShadow: '0 4px 20px hsl(217 91% 60% / 0.3)' }}>
            ASA
          </div>
          <h1 className="font-heading font-extrabold text-3xl tracking-tight">Velkommen tilbage</h1>
          <p className="text-muted-foreground text-sm mt-2">Log ind på ASA Dialer</p>
        </div>

        <div className="card-surface rounded-2xl p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="label-clean">Email</label>
              <input
                className="input-clean"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="din@email.dk"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-clean">Adgangskode</label>
              <input
                className="input-clean"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-smooth w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? '⏳ Logger ind...' : '🔐 Log ind'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <span className="text-sm text-muted-foreground">Har du ikke en konto? </span>
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Opret konto
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
