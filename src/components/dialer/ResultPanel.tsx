import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/leads';

interface ResultPanelProps {
  lead: Lead | null;
  onSave: (status: string, note?: string) => void;
  onNext: () => void;
}

const outcomes = [
  { id: 'sale', icon: '💰', label: 'Salg', color: 'bg-success/10 text-success border-success/30' },
  { id: 'interested', icon: '👍', label: 'Interesseret', color: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'callback', icon: '🔄', label: 'Genopkald', color: 'bg-info/10 text-info border-info/30' },
  { id: 'not_interested', icon: '👎', label: 'Ikke interesseret', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { id: 'no_answer', icon: '📵', label: 'Ingen svar', color: 'bg-warning/10 text-warning border-warning/30' },
  { id: 'voicemail', icon: '📞', label: 'Telefonsvarer', color: 'bg-muted text-muted-foreground border-border' },
  { id: 'wrong_number', icon: '❌', label: 'Forkert nummer', color: 'bg-destructive/10 text-destructive border-destructive/30' },
];

export const ResultPanel: React.FC<ResultPanelProps> = ({ lead, onSave, onNext }) => {
  const [note, setNote] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  useEffect(() => {
    setNote(lead?.note || '');
    setSelectedOutcome(null);
  }, [lead]);

  if (!lead) {
    return (
      <div className="w-[300px] border-l border-border/50 p-6 flex items-center justify-center shrink-0 bg-card">
        <div className="text-muted-foreground text-sm">Ingen emne valgt</div>
      </div>
    );
  }

  const handleSave = () => {
    if (!selectedOutcome) return;
    onSave(selectedOutcome, note);
    setNote('');
    setSelectedOutcome(null);
  };

  return (
    <div className="w-[300px] border-l border-border/50 p-6 flex flex-col gap-5 shrink-0 overflow-y-auto bg-card">
      <div className="font-heading font-bold text-[15px] pb-3 border-b border-border/50 tracking-tight flex items-center gap-2">
        📋 Resultat
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <label className="label-clean">Noter</label>
        <textarea
          className="input-clean resize-none h-28"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Skriv noter om samtalen..."
        />
      </div>

      {/* Outcome selection */}
      <div className="flex flex-col gap-2">
        <label className="label-clean">Udfald</label>
        <div className="grid grid-cols-1 gap-1.5">
          {outcomes.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOutcome(o.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all duration-200
                ${selectedOutcome === o.id
                  ? `${o.color} border-2 scale-[1.02]`
                  : 'bg-transparent border-border/50 text-foreground/70 hover:bg-secondary/50'
                }`}
            >
              <span>{o.icon}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!selectedOutcome}
        className={`btn-primary-smooth flex items-center justify-center gap-2 transition-opacity ${!selectedOutcome ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        💾 Gem & næste
      </button>

      <button className="btn-ghost-smooth flex items-center justify-center gap-2" onClick={onNext}>
        ⏭ Spring over
      </button>
    </div>
  );
};
