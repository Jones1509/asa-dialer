import React from 'react';
import { LeadsPanel } from '@/components/dialer/LeadsPanel';
import { StamdataPanel } from '@/components/dialer/StamdataPanel';
import { ResultPanel } from '@/components/dialer/ResultPanel';
import { Lead } from '@/types/leads';
import { leadsData } from '@/types/leads';

interface DialerPageProps {
  filteredLeads: Lead[];
  currentLeadIdx: number;
  currentLead: Lead;
  searchQuery: string;
  onSearch: (q: string) => void;
  onSelectLead: (idx: number) => void;
  onSaveLead: (status: string) => void;
  onNextLead: () => void;
  onVoicemail: () => void;
}

export const DialerPage: React.FC<DialerPageProps> = ({
  filteredLeads, currentLeadIdx, currentLead, searchQuery,
  onSearch, onSelectLead, onSaveLead, onNextLead, onVoicemail,
}) => {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-7 pt-5 pb-2 text-[13px] text-muted-foreground flex items-center gap-1.5 font-medium">
        🏠 Hjem <span className="text-muted-foreground/40">›</span> <span className="text-foreground">Dialer</span> <span className="text-muted-foreground/40">›</span> Elektriker firmaer Jonas
      </div>
      <div className="flex-1 flex overflow-hidden">
        <LeadsPanel
          leads={filteredLeads}
          currentLeadIdx={currentLeadIdx}
          searchQuery={searchQuery}
          onSearch={onSearch}
          onSelect={onSelectLead}
          allLeads={leadsData}
        />
        <StamdataPanel lead={currentLead} />
        <ResultPanel onSave={onSaveLead} onNext={onNextLead} onVoicemail={onVoicemail} />
      </div>
    </div>
  );
};
