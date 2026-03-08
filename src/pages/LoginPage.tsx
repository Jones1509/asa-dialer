import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 70% 20%, hsl(25 80% 25% / 0.6), transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(25 70% 20% / 0.5), transparent 60%), radial-gradient(ellipse at 90% 90%, hsl(30 60% 15% / 0.4), transparent 50%), hsl(0 0% 5%)',
      }}>
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <span className="font-heading font-extrabold text-5xl tracking-tight" style={{ color: 'hsl(25 90% 55%)' }}>
              3SA
            </span>
            <div className="font-heading font-semibold text-sm tracking-[0.2em] uppercase" style={{ color: 'hsl(25 90% 55%)' }}>
              Dialer
            </div>
          </div>
        </div>

        {/* Bruger / Admin toggle */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
            style={{
              background: 'hsl(25 90% 55%)',
              color: 'white',
              boxShadow: '0 4px 14px hsl(25 90% 55% / 0.4)',
            }}
          >
            👤 Bruger
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
            style={{
              background: 'transparent',
              color: 'hsl(0 0% 80%)',
              border: '1px solid hsl(0 0% 30%)',
            }}
          >
            🛡️ Admin
          </button>
        </div>

        <h1 className="font-heading font-extrabold text-3xl tracking-tight text-center mb-1" style={{ color: 'hsl(0 0% 95%)' }}>
          Velkommen tilbage!
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: 'hsl(0 0% 55%)' }}>
          Har du ikke en konto endnu?{' '}
          <button onClick={() => navigate('/register')} className="bg-transparent border-none cursor-pointer font-semibold hover:underline" style={{ color: 'hsl(25 90% 55%)' }}>
            Opret konto
          </button>
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@email.dk"
              required
              className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300"
              style={{
                background: 'hsl(220 20% 92%)',
                color: 'hsl(220 20% 14%)',
                border: '2px solid transparent',
              }}
              onFocus={e => e.target.style.borderColor = 'hsl(25 90% 55%)'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-40">📧</span>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-300"
              style={{
                background: 'hsl(220 20% 92%)',
                color: 'hsl(220 20% 14%)',
                border: '2px solid transparent',
              }}
              onFocus={e => e.target.style.borderColor = 'hsl(25 90% 55%)'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-40 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'hsl(0 70% 50% / 0.15)', color: 'hsl(0 70% 65%)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full text-sm font-bold cursor-pointer transition-all duration-300 border-none"
            style={{
              background: 'hsl(25 90% 55%)',
              color: 'white',
              boxShadow: '0 4px 20px hsl(25 90% 55% / 0.4)',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Logger ind...' : 'Log ind'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'hsl(0 0% 55%)' }}>
          Glemt din adgangskode?
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
