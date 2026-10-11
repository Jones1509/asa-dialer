import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Menu, X } from 'lucide-react';
import asaDialerLogo from '@/assets/asa-dialer-logo.svg';

export interface ShellNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Egen handling (fx log ud / skift til admin) i stedet for sideskift */
  onClick?: () => void;
  tone?: 'default' | 'danger';
}

interface AppShellProps {
  items: ShellNavItem[];
  footerItems?: ShellNavItem[];
  active: string;
  onSelect: (id: string) => void;
  /** Vises i mobil-headeren ved siden af logoet */
  title: string;
  /** Lille mærkat, fx "Admin" */
  badge?: string;
  children: React.ReactNode;
}

/**
 * Fælles app-skal: ikon-rail på tablet/desktop, header + hamburger-skuffe på mobil.
 */
export const AppShell: React.FC<AppShellProps> = ({ items, footerItems = [], active, onSelect, title, badge, children }) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const run = (item: ShellNavItem) => {
    setOpen(false);
    if (item.onClick) item.onClick();
    else onSelect(item.id);
  };

  const railButton = (item: ShellNavItem) => {
    const Icon = item.icon;
    const isActive = !item.onClick && active === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => run(item)}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150
          ${isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : item.tone === 'danger'
              ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {item.label}
        </span>
      </button>
    );
  };

  const drawerRow = (item: ShellNavItem) => {
    const Icon = item.icon;
    const isActive = !item.onClick && active === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => run(item)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium transition-colors duration-150
          ${isActive
            ? 'bg-accent text-accent-foreground'
            : item.tone === 'danger'
              ? 'text-foreground hover:bg-destructive/10 hover:text-destructive'
              : 'text-foreground hover:bg-secondary'}`}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={isActive ? 'text-primary' : 'text-muted-foreground'} />
        {item.label}
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:flex-row">
      {/* Rail — tablet og op */}
      <nav aria-label="Hovedmenu" className="hidden w-[72px] shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-4 md:flex">
        <div className="mb-4 flex flex-col items-center gap-1">
          <img src={asaDialerLogo} alt="ASA Dialer" className="h-10 w-10" />
          {badge && <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">{badge}</span>}
        </div>
        {items.map(railButton)}
        <div className="flex-1" />
        {footerItems.map(railButton)}
      </nav>

      {/* Header — mobil */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-2 md:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button type="button" aria-label="Åbn menu" aria-expanded={open} onClick={() => setOpen(true)} className="icon-btn">
          <Menu size={24} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <img src={asaDialerLogo} alt="" className="h-8 w-8" />
        <span className="truncate font-heading text-lg font-semibold text-navy">{title}</span>
        {badge && <span className="ml-auto mr-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">{badge}</span>}
      </header>

      {/* Skuffe — mobil */}
      {open && (
        <div className="fixed inset-0 z-[150] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-navy-ink/50 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[288px] max-w-[85vw] flex-col bg-card shadow-2xl animate-fade-in" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex h-14 items-center gap-2 border-b border-border px-4">
              <img src={asaDialerLogo} alt="" className="h-8 w-8" />
              <span className="font-heading text-lg font-semibold text-navy">ASA Dialer</span>
              <button ref={closeRef} type="button" aria-label="Luk menu" onClick={() => setOpen(false)} className="icon-btn ml-auto">
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {items.map(drawerRow)}
            </div>
            {footerItems.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-border p-3">
                {footerItems.map(drawerRow)}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};

/** Skelet af app-skallen mens login-status hentes (i stedet for "Indlæser..."). */
export const ShellSkeleton: React.FC = () => (
  <div className="flex h-[100dvh] flex-col bg-background md:flex-row" aria-busy="true" aria-label="Indlæser">
    <div className="hidden w-[72px] flex-col items-center gap-3 border-r border-border bg-card py-4 md:flex">
      <div className="skeleton h-10 w-10 rounded-xl" />
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-11 w-11 rounded-xl" />)}
    </div>
    <div className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
      <div className="skeleton h-8 w-8 rounded-lg" />
      <div className="skeleton h-4 w-32" />
    </div>
    <div className="page flex flex-col gap-6">
      <div className="skeleton h-8 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
      </div>
    </div>
  </div>
);
