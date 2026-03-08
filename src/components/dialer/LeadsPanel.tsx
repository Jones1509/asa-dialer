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
  leads, currentLeadIdx, searchQuery, onSearch, onSelect, allLeads,
}) => {
  return (
    <div className="w-[320px] border-r border-border/40 flex flex-col shrink-0 bg-card">
      <div className="px-4 py-3.5 border-b border-border/40 flex items-center justify-between">
        <span className="font-heading font-bold text-[14px] tracking-tight">Emner</span>
        <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums">{allLeads.length}</span>
      </div>
      <div className="px-3 py-2.5 border-b border-border/40">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            className="input-clean pl-8 py-2 text-[13px]"
            placeholder="Søg emne..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {leads.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-[13px]">Ingen emner fundet</div>
        )}
        {leads.map((lead) => {
          const realIdx = allLeads.findIndex(l => l.id === lead.id);
          const isActive = realIdx === currentLeadIdx;
          const sc = statusConfig[lead.status] || { dot: 'bg-primary', label: lead.status };
          return (
            <div
              key={lead.id}
              onClick={() => onSelect(realIdx)}
              className={`px-3.5 py-3 border-b border-border/20 cursor-pointer flex items-center gap-2.5
                transition-all duration-150 ease-out
                ${isActive
                  ? 'bg-accent/60 border-l-[2.5px] border-l-primary'
                  : 'hover:bg-secondary/40'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-[11px] shrink-0 tracking-wide
                transition-all duration-200
                ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {lead.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-[13px] whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'text-foreground' : 'text-foreground/75'}`}>
                  {lead.company}
                </div>
                <div className="text-[11px] text-muted-foreground/70 mt-0.5 tabular-nums">{lead.phone}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-muted-foreground/60">{sc.label}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
