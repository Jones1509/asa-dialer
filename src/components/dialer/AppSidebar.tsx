import React from 'react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'dialer', icon: '📞', label: 'Dialer' },
  { id: 'incoming', icon: '📲', label: 'Indgående' },
  { id: 'campaigns', icon: '📋', label: 'Kampagner' },
  { id: 'shop', icon: '🛍️', label: 'Produktshop' },
  { id: 'reports', icon: '📊', label: 'Rapporter' },
];

export const AppSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  return (
    <div className="w-[72px] bg-sidebar border-r border-sidebar-border flex flex-col items-center py-5 gap-1.5 shrink-0">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center font-heading font-extrabold text-[12px] text-primary-foreground mb-5"
        style={{ boxShadow: '0 4px 14px hsl(25 95% 53% / 0.35)' }}>
        3SA
      </div>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          title={item.label}
          className={`w-11 h-11 rounded-xl border-none cursor-pointer flex items-center justify-center text-[17px] relative group
            transition-all duration-300 ease-out
            ${activePage === item.id
              ? 'bg-gradient-to-br from-primary to-orange-400 text-primary-foreground shadow-[0_3px_12px_hsl(25_95%_53%/0.3)]'
              : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
        >
          {item.icon}
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
            {item.label}
          </span>
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => onNavigate('settings')}
        title="Indstillinger"
        className={`w-11 h-11 rounded-xl border-none cursor-pointer flex items-center justify-center text-[17px] group relative
          transition-all duration-300 ease-out
          ${activePage === 'settings'
            ? 'bg-gradient-to-br from-primary to-orange-400 text-primary-foreground shadow-[0_3px_12px_hsl(25_95%_53%/0.3)]'
            : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
      >
        ⚙️
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
          Indstillinger
        </span>
      </button>
      <button
        onClick={onLogout}
        title="Log ud"
        className="w-11 h-11 rounded-xl border-none cursor-pointer flex items-center justify-center text-[17px] bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 ease-out group relative"
      >
        🚪
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
          Log ud
        </span>
      </button>
    </div>
  );
};
