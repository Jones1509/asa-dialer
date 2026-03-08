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
    <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-1 shrink-0">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-heading font-extrabold text-[13px] text-primary-foreground mb-4 shadow-lg">
        3SA
      </div>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          title={item.label}
          className={`w-11 h-11 rounded-lg border-none cursor-pointer flex items-center justify-center text-lg transition-all duration-200 relative
            ${activePage === item.id
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          {item.icon}
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => onNavigate('settings')}
        title="Indstillinger"
        className={`w-11 h-11 rounded-lg border-none cursor-pointer flex items-center justify-center text-lg transition-all duration-200
          ${activePage === 'settings'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
      >
        ⚙️
      </button>
      <button
        onClick={onLogout}
        title="Log ud"
        className="w-11 h-11 rounded-lg border-none cursor-pointer flex items-center justify-center text-lg bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
      >
        🚪
      </button>
    </div>
  );
};
