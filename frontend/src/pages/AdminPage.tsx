import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminCampaignsTab } from '@/components/admin/AdminCampaignsTab';
import { AdminProductsTab } from '@/components/admin/AdminProductsTab';
import { Users, LayoutGrid, ShoppingBag, Phone, LogOut, Check } from 'lucide-react';
import { AppShell, ShellNavItem } from '@/components/shell/AppShell';

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

  const activeLabel = tabs.find(t => t.id === activeTab)?.label ?? 'Admin';
  const footerItems: ShellNavItem[] = [
    { id: 'to-dialer', icon: Phone, label: 'Til Dialer', onClick: () => navigate('/') },
    { id: 'logout', icon: LogOut, label: 'Log ud', tone: 'danger', onClick: async () => { await signOut(); navigate('/login'); } },
  ];

  return (
    <AppShell items={tabs} footerItems={footerItems} active={activeTab} onSelect={setActiveTab} title={activeLabel} badge="Admin">
      <div className="hidden h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-6 md:flex">
        <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">Admin</span>
        <h1 className="font-heading text-lg font-bold text-navy">{activeLabel}</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div key={activeTab} className="page animate-fade-in">
          {renderTab()}
        </div>
      </div>

      <div role="status" aria-live="polite" className={`fixed bottom-4 left-4 right-4 z-[200] flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg transition-all duration-150 ease-out sm:bottom-6 sm:left-auto sm:right-6
        ${notification ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15">
          <Check size={16} strokeWidth={2.5} className="text-success" aria-hidden="true" />
        </span>
        {notification}
      </div>
    </AppShell>
  );
};

export default AdminPage;
