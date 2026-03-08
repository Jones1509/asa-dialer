import React, { useState } from 'react';

interface ResultPanelProps {
  onSave: (status: string) => void;
  onNext: () => void;
  onVoicemail: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ onSave, onNext, onVoicemail }) => {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Ubehandlet');

  return (
    <div className="w-[320px] border-l border-border/50 p-6 flex flex-col gap-5 shrink-0 overflow-y-auto bg-card/50">
      <div className="font-heading font-bold text-[15px] pb-3 border-b border-border/50 tracking-tight">📋 Resultatdata</div>
      <div className="flex flex-col gap-2">
        <label className="label-clean">Note</label>
        <textarea
          className="input-clean resize-none h-24"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Tilføj noter..."
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="label-clean">Status</label>
        <select className="input-clean cursor-pointer" value={status} onChange={e => setStatus(e.target.value)}>
          <option>Ubehandlet</option>
          <option>Interesseret</option>
          <option>Ikke interesseret</option>
          <option>Genopkald</option>
          <option>Telefonsvarer</option>
          <option>Optaget</option>
          <option>Salg</option>
        </select>
      </div>
      <button className="btn-ghost-smooth flex items-center justify-center gap-2" onClick={onVoicemail}>
        📵 Telefonsvarer
      </button>
      <div className="flex flex-col gap-2">
        <label className="label-clean">Gem emne som</label>
        <select className="input-clean cursor-pointer">
          <option>Vælg bruger (valgfrit)</option>
          <option>Jonas Rydendahl</option>
        </select>
      </div>
      <button onClick={() => onSave(status)} className="btn-primary-smooth flex items-center justify-center gap-2">
        💾 Gem emne
      </button>
      <button className="btn-ghost-smooth flex items-center justify-center gap-2" onClick={onNext}>
        ⏭ Næste emne
      </button>
    </div>
  );
};
