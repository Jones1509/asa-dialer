import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/leads';
import { Save, SkipForward, DollarSign, ThumbsUp, RefreshCw, ThumbsDown, PhoneOff, Voicemail, XCircle } from 'lucide-react';

interface ResultPanelProps {
  lead: Lead | null;
  onSave: (status: string, note?: string) => void;
  onNext: () => void;
  className?: string;
}

const outcomes = [
  { id: 'sale', icon: DollarSign, label: 'Salg', color: 'bg-success/10 text-success border-success/30' },
  { id: 'interested', icon: ThumbsUp, label: 'Interesseret', color: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'callback', icon: RefreshCw, label: 'Genopkald', color: 'bg-info/10 text-info border-info/30' },
  { id: 'not_interested', icon: ThumbsDown, label: 'Ikke interesseret', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { id: 'no_answer', icon: PhoneOff, label: 'Ingen svar', color: 'bg-warning/10 text-warning border-warning/30' },
  { id: 'voicemail', icon: Voicemail, label: 'Telefonsvarer', color: 'bg-muted text-foreground border-input' },
  { id: 'wrong_number', icon: XCircle, label: 'Forkert nummer', color: 'bg-destructive/10 text-destructive border-destructive/30' },
];

export const ResultPanel: React.FC<ResultPanelProps> = ({ lead, onSave, onNext, className = '' }) => {
  const [note, setNote] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  useEffect(() => {
    setNote(lead?.note || '');
    setSelectedOutcome(null);
  }, [lead]);

  if (!lead) {
    return (
      <aside className={`w-full items-center justify-center bg-card p-5 lg:w-[260px] lg:shrink-0 lg:border-l lg:border-border xl:w-[300px] ${className}`}>
        <div className="text-sm text-muted-foreground">Vælg et emne i listen for at registrere resultatet.</div>
      </aside>
    );
  }

  const handleSave = () => {
    if (!selectedOutcome) return;
    onSave(selectedOutcome, note);
    setNote('');
    setSelectedOutcome(null);
  };

  return (
    <aside aria-label="Resultat" className={`w-full flex-col gap-4 overflow-y-auto bg-card p-4 sm:p-5 lg:w-[260px] lg:shrink-0 lg:border-l lg:border-border xl:w-[300px] ${className}`}>
      <h2 className="section-title border-b border-border pb-3">Resultat</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-note" className="label-clean">Noter</label>
        <textarea
          id="lead-note"
          className="input-clean resize-none h-24"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Skriv noter om samtalen..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="outcome-label" className="label-clean">Udfald</span>
        <div role="radiogroup" aria-labelledby="outcome-label" className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {outcomes.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={selectedOutcome === o.id}
                onClick={() => setSelectedOutcome(o.id)}
                className={`flex min-h-11 md:min-h-10 items-center gap-2 px-3 rounded-lg border text-sm font-medium cursor-pointer transition-colors duration-150
                  ${selectedOutcome === o.id
                    ? `${o.color} shadow-sm font-semibold`
                    : 'bg-transparent border-border text-foreground hover:bg-secondary'
                  }`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!selectedOutcome}
        className="btn-primary w-full"
      >
        <Save size={16} strokeWidth={2} aria-hidden="true" />
        Gem & næste
      </button>

      {!selectedOutcome && <p className="-mt-2 text-center text-xs text-muted-foreground">Vælg et udfald for at gemme</p>}

      <button type="button" className="btn-secondary w-full" onClick={onNext}>
        <SkipForward size={16} strokeWidth={2} aria-hidden="true" />
        Spring over
      </button>
    </aside>
  );
};
