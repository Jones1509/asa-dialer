import React, { useState } from 'react';
import { LeadsPanel } from '@/components/dialer/LeadsPanel';
import { StamdataPanel } from '@/components/dialer/StamdataPanel';
import { ResultPanel } from '@/components/dialer/ResultPanel';
import { EmptyState } from '@/components/shell/states';
import { Lead } from '@/types/leads';
import { LayoutGrid, ChevronRight } from 'lucide-react';

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
  callActive?: boolean;
  tetrisEnabled?: boolean;
  onGoToCampaigns?: () => void;
}

type MobileTab = 'leads' | 'lead' | 'result';

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: 'leads', label: 'Emner' },
  { id: 'lead', label: 'Stamdata' },
  { id: 'result', label: 'Resultat' },
];

export const DialerPage: React.FC<DialerPageProps> = ({
  leads, filteredLeads, currentLeadIdx, currentLead, searchQuery, campaignName,
  onSearch, onSelectLead, onSaveLead, onNextLead, loadingLeads, callActive, tetrisEnabled, onGoToCampaigns,
}) => {
  // Under 1024px vises ét panel ad gangen via faner; fra 1024px står de tre kolonner side om side.
  const [tab, setTab] = useState<MobileTab>('leads');

  if (loadingLeads) {
    return (
      <div className="flex flex-1 overflow-hidden" aria-busy="true" aria-label="Indlæser emner">
        <div className="flex w-full flex-col gap-2 border-r border-border bg-card p-4 lg:w-[280px] xl:w-[320px]">
          <div className="skeleton mb-2 h-10 w-full" />
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
        </div>
        <div className="hidden flex-1 flex-col gap-4 p-6 lg:flex">
          <div className="skeleton h-6 w-40" />
          <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-11" />)}</div>
          <div className="skeleton flex-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto">
        <EmptyState
          icon={LayoutGrid}
          title="Ingen kampagne valgt"
          message="Vælg en af dine kampagner for at hente emner og begynde at ringe."
          action={onGoToCampaigns ? { label: 'Gå til kampagner', onClick: onGoToCampaigns } : undefined}
        />
      </div>
    );
  }

  const selectAndShow = (idx: number) => {
    onSelectLead(idx);
    setTab('lead');
  };

  return (
    <div className="mx-auto flex w-full max-w-[2400px] flex-1 flex-col overflow-hidden">
      <nav aria-label="Brødkrumme" className="flex min-w-0 items-center gap-1 px-4 pb-2 pt-3 text-xs font-medium text-muted-foreground sm:px-6">
        <span className="text-foreground">Dialer</span>
        <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{campaignName}</span>
      </nav>

      {/* Faner — kun under 1024px */}
      <div role="tablist" aria-label="Dialer-paneler" className="mx-4 mb-3 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1 sm:mx-6 lg:hidden">
        {MOBILE_TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-lg text-sm font-medium transition-colors duration-150 ${tab === t.id ? 'bg-card text-navy shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden lg:border-t lg:border-border">
        <LeadsPanel
          className={`${tab === 'leads' ? 'flex' : 'hidden'} lg:flex`}
          leads={filteredLeads}
          currentLeadIdx={currentLeadIdx}
          searchQuery={searchQuery}
          onSearch={onSearch}
          onSelect={selectAndShow}
          allLeads={leads}
        />
        <StamdataPanel
          className={`${tab === 'lead' ? 'flex' : 'hidden'} lg:flex`}
          lead={currentLead}
          campaignName={campaignName}
          callActive={callActive}
          tetrisEnabled={tetrisEnabled}
        />
        <ResultPanel
          className={`${tab === 'result' ? 'flex' : 'hidden'} lg:flex`}
          lead={currentLead}
          onSave={(s, n) => { onSaveLead(s, n); setTab('lead'); }}
          onNext={() => { onNextLead(); setTab('lead'); }}
        />
      </div>
    </div>
  );
};
