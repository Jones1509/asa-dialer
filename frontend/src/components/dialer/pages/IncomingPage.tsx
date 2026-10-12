import React from 'react';
import { PhoneIncoming, Phone, Clock } from 'lucide-react';
import { EmptyState } from '@/components/shell/states';

export const IncomingPage: React.FC = () => {
  const stats = [
    { label: 'I dag', value: '0', icon: Phone, color: 'bg-primary' },
    { label: 'Denne uge', value: '0', icon: PhoneIncoming, color: 'bg-info' },
    { label: 'Gns. ventetid', value: '—', icon: Clock, color: 'bg-warning' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page flex flex-col gap-6">
        <header>
          <h1 className="page-title">Indgående opkald</h1>
          <p className="page-subtitle">Opkald til dit nummer vises her, og du får en besked på skærmen når det ringer.</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card-surface relative overflow-hidden p-5">
                <div className={`absolute inset-x-0 top-0 h-0.5 ${s.color}`} aria-hidden="true" />
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Icon size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="text-2xl font-semibold tabular-nums text-navy">{s.value}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>

        <section className="card-surface overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <PhoneIncoming size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="section-title">Opkaldshistorik</h2>
          </div>
          <EmptyState
            icon={PhoneIncoming}
            title="Ingen indgående opkald endnu"
            message="Når en kunde ringer, tager du opkaldet direkte i Dialeren. Historik over indgående opkald vises her, når funktionen er slået til."
          />
        </section>
      </div>
    </div>
  );
};
