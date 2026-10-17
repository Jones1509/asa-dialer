import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Action {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

/** Venlig tom-tilstand med forklaring og (valgfri) handling. */
export const EmptyState: React.FC<{ icon: LucideIcon; title: string; message?: string; action?: Action; className?: string }> = ({
  icon: Icon, title, message, action, className = '',
}) => (
  <div className={`flex flex-col items-center gap-3 px-6 py-12 text-center ${className}`}>
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
      <Icon size={24} strokeWidth={1.75} className="text-primary" aria-hidden="true" />
    </div>
    <div className="font-heading text-lg font-bold text-navy">{title}</div>
    {message && <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>}
    {action && (
      <button type="button" onClick={action.onClick} className="btn-primary mt-2">
        {action.icon && <action.icon size={16} strokeWidth={2} aria-hidden="true" />}
        {action.label}
      </button>
    )}
  </div>
);

/** Fejl-tilstand: klar besked + hvad man kan gøre. */
export const ErrorState: React.FC<{ title?: string; message?: string; onRetry?: () => void; className?: string }> = ({
  title = 'Kunne ikke hente data',
  message = 'Tjek din internetforbindelse og prøv igen. Fortsætter fejlen, så kontakt en administrator.',
  onRetry,
  className = '',
}) => (
  <div role="alert" className={`flex flex-col items-center gap-3 px-6 py-12 text-center ${className}`}>
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
      <AlertTriangle size={24} strokeWidth={1.75} className="text-destructive" aria-hidden="true" />
    </div>
    <div className="font-heading text-lg font-bold text-navy">{title}</div>
    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-secondary mt-2">
        <RefreshCw size={16} strokeWidth={2} aria-hidden="true" />
        Prøv igen
      </button>
    )}
  </div>
);

/** Skelet-liste til rækker (fx brugere, opkald). */
export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="flex flex-col divide-y divide-border" aria-busy="true" aria-label="Indlæser">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-4">
        <div className="skeleton h-9 w-9 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="skeleton h-3.5 w-1/3" />
          <div className="skeleton h-3 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

/** Skelet-gitter til kort. */
export const SkeletonCards: React.FC<{ count?: number; className?: string; height?: string }> = ({ count = 3, className = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3', height = 'h-40' }) => (
  <div className={`grid gap-4 ${className}`} aria-busy="true" aria-label="Indlæser">
    {Array.from({ length: count }).map((_, i) => <div key={i} className={`skeleton rounded-2xl ${height}`} />)}
  </div>
);
