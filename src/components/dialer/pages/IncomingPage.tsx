import React from 'react';
import { PhoneIncoming, PhoneOff } from 'lucide-react';

export const IncomingPage: React.FC = () => {
  return (
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <h1 className="font-heading font-bold text-xl tracking-tight">Indgående opkald</h1>
      <div className="card-surface rounded-2xl p-12 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
          <PhoneOff size={24} className="text-muted-foreground/40" strokeWidth={1.5} />
        </div>
        <div className="text-[15px] text-foreground/70 font-medium">Ingen indgående opkald</div>
        <div className="text-[13px] text-muted-foreground/60 max-w-[280px] leading-relaxed">Opkald vil automatisk dukke op her når de modtages</div>
      </div>
    </div>
  );
};
