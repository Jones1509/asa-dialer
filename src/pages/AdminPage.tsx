import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminCampaignsTab } from '@/components/admin/AdminCampaignsTab';
import { AdminProductsTab } from '@/components/admin/AdminProductsTab';

const tabs = [
  { id: 'users', icon: '👥', label: 'Brugere' },
  { id: 'campaigns', icon: '📋', label: 'Kampagner' },
  { id: 'products', icon: '🛍️', label: 'Produkter' },
];

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2800);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'users': return <AdminUsersTab showNotif={showNotif} />;
      case 'campaigns': return <AdminCampaignsTab showNotif={showNotif} />;
      case 'products': return <AdminProductsTab showNotif={showNotif} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-[72px] bg-card border-r border-border/50 flex flex-col items-center py-5 gap-1.5 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center font-heading font-extrabold text-[11px] text-destructive-foreground mb-5 tracking-wide"
          style={{ boxShadow: '0 4px 14px hsl(0 72% 51% / 0.35)' }}>
          ADM
        </div>
        {tabs.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            className={`w-11 h-11 rounded-xl border-none cursor-pointer flex items-center justify-center text-[17px] relative group transition-all duration-300 ease-out
              ${activeTab === item.id
                ? 'bg-primary text-primary-foreground shadow-[0_3px_12px_hsl(217_91%_60%/0.3)]'
                : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
          >
            {item.icon}
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
              {item.label}
            </span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => navigate('/')}
          title="Til Dialer"
          className="w-11 h-11 rounded-xl border-none cursor-pointer flex items-center justify-center text-[17px] bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300 ease-out group relative"
        >
          📞
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
            Til Dialer
          </span>
        </button>
        <button
          onClick={async () => { await signOut(); navigate('/login'); }}
          title="Log ud"
          className="w-11 h-11 rounded-xl border-none cursor-pointer flex items-center justify-center text-[17px] bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 ease-out group relative"
        >
          🚪
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
            Log ud
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[60px] bg-card border-b border-border/50 flex items-center px-6 gap-4 shrink-0"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div className="bg-destructive/10 text-destructive text-xs font-bold rounded-full px-3 py-1">
            ADMIN MODE
          </div>
          <h1 className="font-heading font-bold text-lg tracking-tight">
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
          {renderTab()}
        </div>
      </div>

      {/* Notification */}
      <div className={`fixed bottom-6 right-6 bg-card border border-border/50 rounded-2xl px-5 py-3.5 text-sm font-medium flex items-center gap-2.5 z-[200]
        transition-all duration-500 ease-out
        ${notification
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        {notification}
      </div>
    </div>
  );
};

export default AdminPage;
