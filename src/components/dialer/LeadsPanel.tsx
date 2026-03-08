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

const statusDotClass: Record<string, string> = {
  new: 'bg-primary',
  done: 'bg-success',
  recall: 'bg-info',
  busy: 'bg-destructive',
};

export const LeadsPanel: React.FC<LeadsPanelProps> = ({
  leads, currentLeadIdx, searchQuery, onSearch, onSelect, allLeads,
}) => {
  return (
    <div className="w-[340px] border-r border-border/50 flex flex-col shrink-0 bg-card/50">
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <span className="font-heading font-bold text-[15px] tracking-tight">Emner</span>
        <span className="badge-clean">{leads.length}</span>
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
        {leads.map((lead) => {
          const realIdx = allLeads.indexOf(lead);
          const isActive = realIdx === currentLeadIdx;
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
              <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${statusDotClass[lead.status] || 'bg-primary'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
