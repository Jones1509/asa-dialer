import React from 'react';
import { LeadsPanel } from '../LeadsPanel';
import { StamdataPanel } from '../StamdataPanel';
import { ResultPanel } from '../ResultPanel';
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
      <div className="px-6 pt-4 text-sm text-muted-foreground flex items-center gap-1.5">
        🏠 Hjem › <span className="text-foreground">Dialer</span> › Elektriker firmaer Jonas
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
