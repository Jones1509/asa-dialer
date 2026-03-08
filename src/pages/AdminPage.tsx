import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminCampaignsTab } from '@/components/admin/AdminCampaignsTab';
import { AdminProductsTab } from '@/components/admin/AdminProductsTab';
import { Users, LayoutGrid, ShoppingBag, Phone, LogOut } from 'lucide-react';
import asaIcon from '@/assets/asa-icon.png';

const tabs = [
  { id: 'users', icon: Users, label: 'Brugere' },
  { id: 'campaigns', icon: LayoutGrid, label: 'Kampagner' },
  { id: 'products', icon: ShoppingBag, label: 'Produkter' },
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

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Users;

  return (
    <div className="flex min-h-screen h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-[68px] bg-card border-r border-border/40 flex flex-col items-center py-5 gap-1 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-heading font-extrabold text-[9px] text-primary-foreground mb-6 tracking-widest"
          style={{ boxShadow: '0 4px 14px hsl(217 91% 60% / 0.3)' }}>
          ASA
        </div>
        {tabs.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center relative group transition-all duration-200 ease-out
                ${activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-[0_2px_10px_hsl(217_91%_60%/0.25)]'
                  : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              <Icon size={18} strokeWidth={activeTab === item.id ? 2.2 : 1.8} />
              <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                {item.label}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={() => navigate('/')}
          title="Til Dialer"
          className="w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 ease-out group relative"
        >
          <Phone size={18} strokeWidth={1.8} />
          <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
            Til Dialer
          </span>
        </button>
        <button
          onClick={async () => { await signOut(); navigate('/login'); }}
          title="Log ud"
          className="w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 ease-out group relative"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
            Log ud
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[56px] bg-card border-b border-border/40 flex items-center px-6 gap-3.5 shrink-0"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div className="bg-primary/10 text-primary text-[10px] font-bold rounded-md px-2.5 py-1 uppercase tracking-wider">
            Admin
          </div>
          <h1 className="font-heading font-bold text-[15px] tracking-tight flex items-center gap-2">
            <ActiveIcon size={16} strokeWidth={1.8} className="text-muted-foreground" />
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
          {renderTab()}
        </div>
      </div>

      {/* Notification */}
      <div className={`fixed bottom-6 right-6 bg-card border border-border/40 rounded-xl px-4 py-3 text-[13px] font-medium flex items-center gap-2 z-[200]
        transition-all duration-400 ease-out
        ${notification
          ? 'translate-y-0 opacity-100'
          : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        {notification}
      </div>
    </div>
  );
};

export default AdminPage;
