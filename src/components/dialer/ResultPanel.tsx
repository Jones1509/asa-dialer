import React, { useState } from 'react';

interface ResultPanelProps {
  onSave: (status: string) => void;
  onNext: () => void;
  onVoicemail: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ onSave, onNext, onVoicemail }) => {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Ubehandlet');

  const labelClass = "text-xs text-muted-foreground font-medium tracking-wider uppercase";
  const inputClass = "bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm font-body outline-none focus:border-primary/40 transition-colors";
  const btnSecondary = "bg-transparent border border-border rounded-lg py-2.5 px-3 text-muted-foreground text-sm cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary";

  return (
    <div className="w-[320px] border-l border-border p-6 flex flex-col gap-4 shrink-0 overflow-y-auto">
      <div className="font-heading font-bold text-base pb-3 border-b border-border">📋 Resultatdata</div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Note</label>
        <textarea
          className={`${inputClass} resize-none h-24`}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Tilføj noter..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Status</label>
        <select className={`${inputClass} cursor-pointer`} value={status} onChange={e => setStatus(e.target.value)}>
          <option>Ubehandlet</option>
          <option>Interesseret</option>
          <option>Ikke interesseret</option>
          <option>Genopkald</option>
          <option>Telefonsvarer</option>
          <option>Optaget</option>
          <option>Salg</option>
        </select>
      </div>
      <button className={btnSecondary} onClick={onVoicemail}>📵 Telefonsvarer</button>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Gem emne som</label>
        <select className={`${inputClass} cursor-pointer`}>
          <option>Vælg bruger (valgfrit)</option>
          <option>Jonas Rydendahl</option>
        </select>
      </div>
      <button
        onClick={() => onSave(status)}
        className="bg-primary text-primary-foreground border-none rounded-lg py-3 font-body font-semibold text-sm cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 hover:-translate-y-0.5"
      >
        💾 Gem emne
      </button>
      <button className={`${btnSecondary} mt-1`} onClick={onNext}>⏭ Næste emne</button>
    </div>
  );
};
