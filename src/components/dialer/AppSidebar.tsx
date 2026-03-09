import React from 'react';
import { Phone, PhoneIncoming, LayoutGrid, ShoppingBag, BarChart3, Settings, LogOut, Shield, Gamepad2 } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onAdminNav?: () => void;
}

const navItems = [
  { id: 'dialer', icon: Phone, label: 'Dialer' },
  { id: 'incoming', icon: PhoneIncoming, label: 'Indgående' },
  { id: 'campaigns', icon: LayoutGrid, label: 'Kampagner' },
  { id: 'shop', icon: ShoppingBag, label: 'Produktshop' },
  { id: 'reports', icon: BarChart3, label: 'Rapporter' },
  { id: 'tetris', icon: Gamepad2, label: 'Tetris' },
];

export const AppSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout, isAdmin, onAdminNav }) => {
  return (
    <div className="w-[68px] bg-card border-r border-border/40 flex flex-col items-center py-5 gap-1 shrink-0">
      <div className="flex flex-col items-center mb-6 gap-0.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-heading font-extrabold text-[11px] text-primary-foreground tracking-wider"
          style={{ boxShadow: '0 4px 14px hsl(217 91% 60% / 0.35)' }}>
          ASA
        </div>
        <span className="font-heading font-semibold text-[7px] tracking-[0.18em] uppercase text-primary/60">Dialer</span>
      </div>
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className={`w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center relative group
              transition-all duration-200 ease-out
              ${activePage === item.id
                ? 'bg-primary text-primary-foreground shadow-[0_2px_10px_hsl(217_91%_60%/0.25)]'
                : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
          >
            <Icon size={18} strokeWidth={activePage === item.id ? 2.2 : 1.8} />
            <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
              {item.label}
            </span>
          </button>
        );
      })}
      <div className="flex-1" />
      
      {isAdmin && onAdminNav && (
        <button
          onClick={onAdminNav}
          title="Admin panel"
          className="w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 ease-out group relative"
        >
          <Shield size={18} strokeWidth={1.8} />
          <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
            Admin panel
          </span>
        </button>
      )}
      <button
        onClick={() => onNavigate('settings')}
        title="Indstillinger"
        className={`w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center group relative
          transition-all duration-200 ease-out
          ${activePage === 'settings'
            ? 'bg-primary text-primary-foreground shadow-[0_2px_10px_hsl(217_91%_60%/0.25)]'
            : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
      >
        <Settings size={18} strokeWidth={1.8} />
        <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
          Indstillinger
        </span>
      </button>
      <button
        onClick={onLogout}
        title="Log ud"
        className="w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 ease-out group relative"
      >
        <LogOut size={18} strokeWidth={1.8} />
        <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
          Log ud
        </span>
      </button>
    </div>
  );
};
