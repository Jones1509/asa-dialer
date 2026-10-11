import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { AuthLayout, AuthTitle, AuthError } from '@/components/auth/AuthLayout';

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
    <AuthLayout>
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <AuthTitle
          title="Opret konto"
          text={<>Har du allerede en konto?{' '}
            <button type="button" onClick={() => navigate('/login')} className="-my-3 inline-block px-1 py-3 font-semibold text-brand-sky underline-offset-4 transition-colors duration-150 hover:text-white hover:underline">
              Log ind
            </button></>}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-first" className="label-dark">Fornavn</label>
            <input id="reg-first" type="text" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} required className="input-dark" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-last" className="label-dark">Efternavn</label>
            <input id="reg-last" type="text" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} required className="input-dark" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="reg-email" className="label-dark">Email</label>
          <input id="reg-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@email.dk" required className="input-dark" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="reg-pw" className="label-dark">Adgangskode</label>
          <div className="relative">
            <input id="reg-pw" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mindst 6 tegn" required className="input-dark pr-12" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
              className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:text-white">
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && <AuthError message={error} />}

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full min-h-12">
          {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Opretter…</> : <><UserPlus size={16} strokeWidth={2} aria-hidden="true" /> Opret konto</>}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
