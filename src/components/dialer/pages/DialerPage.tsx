import React from 'react';
import { LeadsPanel } from '@/components/dialer/LeadsPanel';
import { StamdataPanel } from '@/components/dialer/StamdataPanel';
import { ResultPanel } from '@/components/dialer/ResultPanel';
import { Lead } from '@/types/leads';
import { LayoutGrid, ChevronRight, Home } from 'lucide-react';

interface DialerPageProps {
  leads: Lead[];
  filteredLeads: Lead[];
  currentLeadIdx: number;
  currentLead: Lead | null;
  searchQuery: string;
  campaignName: string;
  onSearch: (q: string) => void;
  onSelectLead: (idx: number) => void;
  onSaveLead: (status: string, note?: string) => void;
  onNextLead: () => void;
  loadingLeads: boolean;
}

export const DialerPage: React.FC<DialerPageProps> = ({
  leads, filteredLeads, currentLeadIdx, currentLead, searchQuery, campaignName,
  onSearch, onSelectLead, onSaveLead, onNextLead, loadingLeads,
}) => {
  if (loadingLeads) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground text-[13px]">Indlæser emner...</div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <LayoutGrid size={40} className="text-muted-foreground/30" strokeWidth={1.2} />
        <div className="text-muted-foreground text-[13px]">Vælg en kampagne for at begynde</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-6 pt-3 pb-2 text-[12px] text-muted-foreground/60 flex items-center gap-1 font-medium">
        <Home size={12} /> <ChevronRight size={10} /> <span className="text-foreground/70 font-semibold">Dialer</span> <ChevronRight size={10} /> {campaignName}
      </div>
      <div className="flex-1 flex overflow-hidden">
        <LeadsPanel
          leads={filteredLeads}
          currentLeadIdx={currentLeadIdx}
          searchQuery={searchQuery}
          onSearch={onSearch}
          onSelect={onSelectLead}
          allLeads={leads}
        />
        <StamdataPanel lead={currentLead} campaignName={campaignName} />
        <ResultPanel lead={currentLead} onSave={onSaveLead} onNext={onNextLead} />
      </div>
    </div>
  );
};
