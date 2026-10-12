import React from 'react';
import { Lead } from '@/types/leads';
import { Search } from 'lucide-react';

interface LeadsPanelProps {
  leads: Lead[];
  currentLeadIdx: number;
  searchQuery: string;
  onSearch: (q: string) => void;
  onSelect: (idx: number) => void;
  allLeads: Lead[];
  className?: string;
}

const statusConfig: Record<string, { dot: string; label: string }> = {
  new: { dot: 'bg-primary', label: 'Ny' },
  no_answer: { dot: 'bg-warning', label: 'Ingen svar' },
  callback: { dot: 'bg-info', label: 'Genopkald' },
  voicemail: { dot: 'bg-muted-foreground', label: 'Telefonsvarer' },
  interested: { dot: 'bg-success', label: 'Interesseret' },
  not_interested: { dot: 'bg-destructive/60', label: 'Ej int.' },
  wrong_number: { dot: 'bg-destructive', label: 'Forkert nr.' },
  sale: { dot: 'bg-success', label: 'Salg' },
};

export const LeadsPanel: React.FC<LeadsPanelProps> = ({
  leads, currentLeadIdx, searchQuery, onSearch, onSelect, allLeads, className = '',
}) => {
  return (
    <section aria-label="Emner" className={`w-full flex-col bg-card lg:w-[280px] lg:shrink-0 lg:border-r lg:border-border xl:w-[320px] ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="section-title">Emner</h2>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{allLeads.length}</span>
      </div>
      <div className="border-b border-border px-3 py-3">
        <div className="relative">
          <label htmlFor="lead-search" className="sr-only">Søg emne</label>
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="lead-search"
            type="search"
            className="input-clean pl-9"
            placeholder="Søg firma eller nummer"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {leads.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Ingen emner matcher “{searchQuery}”.
            <button type="button" onClick={() => onSearch('')} className="btn-ghost btn-sm mx-auto mt-2 flex">Ryd søgning</button>
          </div>
        )}
        {leads.map((lead) => {
          const realIdx = allLeads.findIndex(l => l.id === lead.id);
          const isActive = realIdx === currentLeadIdx;
          const sc = statusConfig[lead.status] || { dot: 'bg-primary', label: lead.status };
          return (
            <button
              type="button"
              key={lead.id}
              onClick={() => onSelect(realIdx)}
              aria-current={isActive ? 'true' : undefined}
              className={`flex min-h-14 w-full items-center gap-3 border-b border-border/60 border-l-2 px-3.5 py-3 text-left transition-colors duration-150
                ${isActive ? 'border-l-primary bg-accent/60' : 'border-l-transparent hover:bg-secondary/60'}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tracking-wide
                ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {lead.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-medium ${isActive ? 'text-navy' : 'text-foreground'}`}>
                  {lead.company}
                </div>
                <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">{lead.phone}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{sc.label}</span>
                <span className={`h-2 w-2 rounded-full ${sc.dot}`} aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
