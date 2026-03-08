import React from 'react';

interface CampaignsPageProps {
  onNavigate: (page: string) => void;
  showNotif: (msg: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate, showNotif }) => {
  return (
    <div className="flex flex-col p-7 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-2xl">📋 Kampagner</h1>
        <button
          onClick={() => showNotif('📋 Ny kampagne oprettet!')}
          className="bg-primary text-primary-foreground border-none rounded-lg px-4 py-2 font-body font-semibold text-sm cursor-pointer hover:opacity-90 transition-all duration-200"
        >
          + Ny kampagne
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <div
          className="card-surface hover-lift rounded-xl p-5 cursor-pointer"
          onClick={() => onNavigate('dialer')}
        >
          <div className="font-heading font-bold text-base mb-2">Elektriker firmaer Jonas</div>
          <div className="text-sm text-muted-foreground mb-4">Ingen beskrivelse</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Kontakter', value: '483' },
              { label: 'Kommende', value: '2' },
              { label: 'Ubehandlet', value: '481' },
              { label: 'Behandlet', value: '1' },
            ].map(s => (
              <div key={s.label} className="bg-muted rounded-lg px-3 py-2.5">
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
                <div className="font-heading font-bold text-lg text-primary">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-3">Oprettet 6.3.2026</div>
        </div>
        <button
          onClick={() => showNotif('📋 Ny kampagne oprettet!')}
          className="border-2 border-dashed border-border rounded-xl p-5 flex items-center justify-center gap-2.5 text-sm text-muted-foreground cursor-pointer bg-transparent font-body hover:border-primary/40 hover:text-primary transition-all duration-200"
        >
          <span className="text-xl">+</span> Opret ny kampagne
        </button>
      </div>
    </div>
  );
};
