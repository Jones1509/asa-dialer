import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/leads';
import { Save, SkipForward, DollarSign, ThumbsUp, RefreshCw, ThumbsDown, PhoneOff, Voicemail, XCircle } from 'lucide-react';

interface ResultPanelProps {
  lead: Lead | null;
  onSave: (status: string, note?: string) => void;
  onNext: () => void;
}

const outcomes = [
  { id: 'sale', icon: DollarSign, label: 'Salg', color: 'bg-success/10 text-success border-success/20' },
  { id: 'interested', icon: ThumbsUp, label: 'Interesseret', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'callback', icon: RefreshCw, label: 'Genopkald', color: 'bg-info/10 text-info border-info/20' },
  { id: 'not_interested', icon: ThumbsDown, label: 'Ikke interesseret', color: 'bg-destructive/8 text-destructive/80 border-destructive/15' },
  { id: 'no_answer', icon: PhoneOff, label: 'Ingen svar', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'voicemail', icon: Voicemail, label: 'Telefonsvarer', color: 'bg-muted text-muted-foreground border-border/50' },
  { id: 'wrong_number', icon: XCircle, label: 'Forkert nummer', color: 'bg-destructive/8 text-destructive/80 border-destructive/15' },
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
      <div className="w-[280px] border-l border-border/40 p-5 flex items-center justify-center shrink-0 bg-card">
        <div className="text-muted-foreground text-[13px]">Ingen emne valgt</div>
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
    <div className="w-[280px] border-l border-border/40 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto bg-card">
      <div className="font-heading font-bold text-[14px] pb-3 border-b border-border/40 tracking-tight">
        Resultat
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-clean">Noter</label>
        <textarea
          className="input-clean resize-none h-24 text-[13px]"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Skriv noter om samtalen..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-clean">Udfald</label>
        <div className="grid grid-cols-1 gap-1">
          {outcomes.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                onClick={() => setSelectedOutcome(o.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium cursor-pointer transition-all duration-150
                  ${selectedOutcome === o.id
                    ? `${o.color} border-2 shadow-sm`
                    : 'bg-transparent border-border/30 text-foreground/65 hover:bg-secondary/40 hover:text-foreground/80'
                  }`}
              >
                <Icon size={14} strokeWidth={2} />
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!selectedOutcome}
        className={`btn-primary-smooth flex items-center justify-center gap-2 text-[13px] ${!selectedOutcome ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <Save size={14} strokeWidth={2} />
        Gem & næste
      </button>

      <button className="btn-ghost-smooth flex items-center justify-center gap-1.5 text-[13px]" onClick={onNext}>
        <SkipForward size={14} strokeWidth={2} />
        Spring over
      </button>
    </div>
  );
};
