import React from 'react';

interface CampaignsPageProps {
  onNavigate: (page: string) => void;
  showNotif: (msg: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate, showNotif }) => {
  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-[26px] tracking-tight">📋 Kampagner</h1>
        <button onClick={() => showNotif('📋 Ny kampagne oprettet!')} className="btn-primary-smooth">
          + Ny kampagne
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        <div className="card-surface hover-lift rounded-2xl p-6 cursor-pointer" onClick={() => onNavigate('dialer')}>
          <div className="font-heading font-bold text-base mb-2 tracking-tight">Elektriker firmaer Jonas</div>
          <div className="text-sm text-muted-foreground mb-5">Ingen beskrivelse</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Kontakter', value: '483' },
              { label: 'Kommende', value: '2' },
              { label: 'Ubehandlet', value: '481' },
              { label: 'Behandlet', value: '1' },
            ].map(s => (
              <div key={s.label} className="bg-background rounded-xl px-3.5 py-3">
                <div className="text-[11px] text-muted-foreground font-medium">{s.label}</div>
                <div className="font-heading font-bold text-lg text-primary mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground/60 mt-4">Oprettet 6.3.2026</div>
        </div>
        <button
          onClick={() => showNotif('📋 Ny kampagne oprettet!')}
          className="border-2 border-dashed border-border/50 rounded-2xl p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground cursor-pointer bg-transparent font-body hover:border-primary/30 hover:text-primary hover:bg-accent/30 transition-all duration-300"
        >
          <span className="text-2xl font-light">+</span> Opret ny kampagne
        </button>
      </div>
    </div>
  );
};
