import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Adgangskoderne stemmer ikke overens');
      return;
    }
    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn');
      return;
    }
    if (!fullName.trim()) {
      setError('Indtast dit fulde navn');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/pending');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-heading font-extrabold text-xl text-primary-foreground mx-auto mb-4"
            style={{ boxShadow: '0 4px 20px hsl(217 91% 60% / 0.3)' }}>
            ASA
          </div>
          <h1 className="font-heading font-extrabold text-3xl tracking-tight">Opret konto</h1>
          <p className="text-muted-foreground text-sm mt-2">Tilmeld dig ASA Dialer</p>
        </div>

        <div className="card-surface rounded-2xl p-8">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="label-clean">Fulde navn</label>
              <input
                className="input-clean"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jonas Rydendahl"
                required
              />
            </div>
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
                placeholder="Mindst 6 tegn"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-clean">Bekræft adgangskode</label>
              <input
                className="input-clean"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Gentag adgangskode"
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
              {loading ? '⏳ Opretter...' : '✨ Opret konto'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <span className="text-sm text-muted-foreground">Har du allerede en konto? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Log ind
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
