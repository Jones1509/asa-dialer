import React from 'react';
import { LeadsPanel } from '@/components/dialer/LeadsPanel';
import { StamdataPanel } from '@/components/dialer/StamdataPanel';
import { ResultPanel } from '@/components/dialer/ResultPanel';
import { Lead } from '@/types/leads';

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
        <div className="text-muted-foreground">⏳ Indlæser emner...</div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <div className="text-4xl">📋</div>
        <div className="text-muted-foreground text-sm">Vælg en kampagne fra kampagne-siden for at begynde</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-7 pt-4 pb-2 text-[13px] text-muted-foreground flex items-center gap-1.5 font-medium">
        🏠 Hjem <span className="text-border">›</span> <span className="text-foreground font-semibold">Dialer</span> <span className="text-border">›</span> {campaignName}
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
