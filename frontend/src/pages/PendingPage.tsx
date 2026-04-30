import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, isApproved, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) { navigate('/admin', { replace: true }); return; }
      if (isApproved) { navigate('/', { replace: true }); return; }
    }
    if (!loading && !user) { navigate('/login', { replace: true }); }
  }, [loading, user, isAdmin, isApproved]);

  // Poll for approval every 10 seconds
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 70% 20%, hsl(217 80% 20% / 0.7), transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(217 70% 15% / 0.6), transparent 60%), radial-gradient(ellipse at 90% 90%, hsl(220 60% 10% / 0.5), transparent 50%), hsl(220 20% 4%)',
      }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[480px] text-center relative z-10">
        {/* ASA Branding */}
        <div className="inline-block mb-6">
          <span className="font-heading font-extrabold text-4xl tracking-tight text-primary">
            ASA
          </span>
          <div className="font-heading font-semibold text-xs tracking-[0.2em] uppercase text-primary/70">
            Dialer
          </div>
        </div>

        <div className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
          <Clock size={36} className="text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight mb-3 text-white">
          Afventer godkendelse
        </h1>
        <p className="text-white/40 text-base leading-relaxed mb-8">
          Din konto afventer godkendelse fra en administrator.<br/>
          Du vil automatisk blive omdirigeret når din konto er godkendt.
        </p>
        <div className="rounded-2xl p-6 mb-6 bg-white/[0.04] border border-white/[0.08]">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
              <span className="text-white/50">Konto under godkendelse</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-[12px] text-white/30">
                <CheckCircle2 size={13} className="text-success" />
                Konto oprettet
              </div>
              <div className="w-6 h-px bg-white/10" />
              <div className="flex items-center gap-2 text-[12px] text-white/30">
                <Clock size={13} className="text-warning animate-pulse" />
                Afventer admin
              </div>
              <div className="w-6 h-px bg-white/10" />
              <div className="flex items-center gap-2 text-[12px] text-white/20">
                <CheckCircle2 size={13} className="text-white/15" />
                Klar til brug
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-transparent border border-white/15 text-white/50 rounded-xl px-5 py-2.5 text-sm font-medium cursor-pointer hover:border-white/30 hover:text-white/70 transition-all duration-300 flex items-center gap-2 mx-auto">
          <ArrowLeft size={14} />
          Tilbage til login
        </button>
      </div>
    </div>
  );
};

export default PendingPage;
