import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] text-center">
        <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-4xl mx-auto mb-6">
          ⏳
        </div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight mb-3">
          Afventer godkendelse
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          Din konto afventer godkendelse fra en administrator.<br/>
          Du vil kunne logge ind så snart din konto er blevet godkendt.
        </p>
        <div className="card-surface rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 justify-center text-sm">
            <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
            <span className="text-muted-foreground">Konto under godkendelse</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost-smooth">
          ← Tilbage til login
        </button>
      </div>
    </div>
  );
};

export default PendingPage;
