import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setError('Indtast dit navn');
      return;
    }
    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn');
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
          <div className="inline-block mb-3">
            <span className="font-heading font-extrabold text-5xl tracking-tight text-primary">
              ASA
            </span>
            <div className="font-heading font-semibold text-sm tracking-[0.2em] uppercase text-primary/70">
              Dialer
            </div>
          </div>
        </div>

        <h1 className="font-heading font-extrabold text-3xl tracking-tight text-center mb-1 text-white">
          Opret konto
        </h1>
        <p className="text-center text-sm mb-8 text-white/40">
          Har du allerede en konto?{' '}
          <button onClick={() => navigate('/login')} className="bg-transparent border-none cursor-pointer font-semibold hover:underline text-primary">
            Log ind
          </button>
        </p>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Fornavn"
                required
                className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.12]"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Efternavn"
                required
                className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.12]"
              />
            </div>
          </div>

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@email.dk"
              required
              className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.12]"
            />
            <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25" />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindst 6 tegn"
              required
              className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-white/[0.08] text-white border-2 border-white/[0.08] placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.12]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-white/25 hover:text-white/50 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="text-sm rounded-xl px-4 py-3 bg-destructive/15 text-destructive/80 border border-destructive/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 border-none bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(217_91%_60%/0.4)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_hsl(217_91%_60%/0.5)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Opretter...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus size={16} strokeWidth={2} />
                Opret konto
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
