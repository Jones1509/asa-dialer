import React from 'react';
import { Lead } from '@/types/leads';

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
  not_interested: { dot: 'bg-destructive', label: 'Ej int.' },
  wrong_number: { dot: 'bg-destructive', label: 'Forkert nr.' },
  sale: { dot: 'bg-success', label: 'Salg' },
};

export const LeadsPanel: React.FC<LeadsPanelProps> = ({
  leads, currentLeadIdx, searchQuery, onSearch, onSelect, allLeads,
}) => {
  return (
    <div className="w-[340px] border-r border-border/50 flex flex-col shrink-0 bg-card">
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <span className="font-heading font-bold text-[15px] tracking-tight">Emner</span>
        <span className="badge-clean">{allLeads.length}</span>
      </div>
      <div className="px-4 py-3 border-b border-border/50">
        <input
          className="input-clean"
          placeholder="🔍  Søg emne..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {leads.length === 0 && (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">Ingen emner fundet</div>
        )}
        {leads.map((lead) => {
          const realIdx = allLeads.findIndex(l => l.id === lead.id);
          const isActive = realIdx === currentLeadIdx;
          const sc = statusConfig[lead.status] || { dot: 'bg-primary', label: lead.status };
          return (
            <div
              key={lead.id}
              onClick={() => onSelect(realIdx)}
              className={`px-4 py-3.5 border-b border-border/30 cursor-pointer flex items-center gap-3
                transition-all duration-250 ease-out
                ${isActive
                  ? 'bg-accent border-l-[3px] border-l-primary'
                  : 'hover:bg-secondary/60'
                }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs shrink-0
                transition-all duration-300
                ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {lead.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-[13px] whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
                  {lead.company}
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">{lead.phone}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{sc.label}</span>
                <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${sc.dot}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
