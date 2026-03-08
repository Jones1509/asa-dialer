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
    <div className="w-[340px] border-r border-border flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="font-heading font-bold text-base">Emner</span>
        <span className="bg-primary/10 text-primary border border-primary/30 rounded-full px-2.5 py-0.5 text-xs font-semibold">
          {leads.length}
        </span>
      </div>
      <div className="px-4 py-3 border-b border-border">
        <input
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
          placeholder="🔍  Søg emne..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {leads.map((lead, i) => {
          const realIdx = allLeads.indexOf(lead);
          const isActive = realIdx === currentLeadIdx;
          return (
            <div
              key={lead.id}
              onClick={() => onSelect(realIdx)}
              className={`px-4 py-3.5 border-b border-border cursor-pointer flex items-center gap-3 transition-all duration-150 hover:bg-muted
                ${isActive ? 'bg-primary/5 border-l-[3px] border-l-primary' : ''}`}
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0">
                {lead.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{lead.company}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{lead.phone}</div>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass[lead.status] || 'bg-primary'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
