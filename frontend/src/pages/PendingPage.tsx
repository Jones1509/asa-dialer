import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

const PendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, isApproved, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) { navigate('/', { replace: true }); return; }
      if (isApproved) { navigate('/', { replace: true }); return; }
    }
    if (!loading && !user) { navigate('/login', { replace: true }); }
  }, [loading, user, isAdmin, isApproved]);

  // Tjek for godkendelse hvert 15. sekund
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
          <Clock size={24} className="text-brand-sky" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-white">Afventer godkendelse</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Din konto skal godkendes af en administrator. Siden opdaterer sig selv, så du kommer direkte ind, når du er godkendt.
        </p>
        <ol className="my-6 flex w-full flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm sm:flex-row sm:justify-between sm:gap-2">
          <li className="flex items-center gap-2 text-white/80"><CheckCircle2 size={16} className="text-success" aria-hidden="true" />Konto oprettet</li>
          <li className="flex items-center gap-2 text-white"><Clock size={16} className="animate-pulse text-warning" aria-hidden="true" />Afventer admin</li>
          <li className="flex items-center gap-2 text-white/50"><CheckCircle2 size={16} className="text-white/30" aria-hidden="true" />Klar til brug</li>
        </ol>
        <button type="button" onClick={handleLogout} className="btn-ghost w-full !text-white/70 hover:!bg-white/10 hover:!text-white">
          <ArrowLeft size={16} aria-hidden="true" />
          Tilbage til login
        </button>
      </div>
    </AuthLayout>
  );
};

export default PendingPage;
