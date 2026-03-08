import React from 'react';
import { PhoneIncoming, Phone, Clock } from 'lucide-react';

export const IncomingPage: React.FC = () => {
  return (
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <h1 className="font-heading font-bold text-xl tracking-tight">Indgående opkald</h1>
      
      <div className="grid grid-cols-3 gap-3.5">
        {[
          { label: 'I dag', value: '0', icon: Phone, color: 'bg-primary' },
          { label: 'Denne uge', value: '0', icon: PhoneIncoming, color: 'bg-info' },
          { label: 'Gns. ventetid', value: '—', icon: Clock, color: 'bg-warning' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card-surface rounded-xl p-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${s.color}`} />
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Icon size={16} className="text-muted-foreground" strokeWidth={1.8} />
              </div>
              <div className="font-heading font-bold text-2xl tracking-tight">{s.value}</div>
              <div className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card-surface rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/30 flex items-center gap-2">
          <PhoneIncoming size={15} className="text-muted-foreground" strokeWidth={1.8} />
          <span className="font-heading font-bold text-[14px] tracking-tight">Opkaldshistorik</span>
        </div>
        <div className="px-5 py-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <PhoneIncoming size={24} className="text-muted-foreground/30" strokeWidth={1.5} />
          </div>
          <div className="text-[14px] text-foreground/70 font-medium">Ingen indgående opkald</div>
          <div className="text-[13px] text-muted-foreground/50 max-w-[300px] leading-relaxed">
            Indgående opkald vil automatisk blive registreret her når funktionen er aktiveret
          </div>
        </div>
      </div>
    </div>
  );
};
