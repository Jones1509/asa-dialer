import React from 'react';
import { Lead } from '@/types/leads';
import { Phone, PhoneOff, Activity, ChevronDown } from 'lucide-react';

interface TopbarProps {
  currentLead: Lead | null;
  callActive: boolean;
  callSeconds: number;
  formatTime: (s: number) => string;
  onStartCall: () => void;
  onEndCall: () => void;
  onActivity: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentLead, callActive, callSeconds, formatTime,
  onStartCall, onEndCall, onActivity,
}) => {
  return (
    <div className="h-[56px] bg-card border-b border-border/40 flex items-center px-5 gap-3.5 shrink-0"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      <div className="flex items-center gap-2.5 bg-background border border-border/50 rounded-lg px-3.5 py-2 font-body text-[13px] font-medium min-w-[180px]">
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
          callActive ? 'bg-success shadow-[0_0_8px_hsl(152_69%_41%/0.5)]' : 'bg-muted-foreground/25'
        }`} />
        <span className="text-foreground/80 tabular-nums">{currentLead?.phone || '—'}</span>
      </div>
      <div className="font-heading text-xs text-primary/80 font-bold tracking-[0.12em] tabular-nums min-w-[42px]">
        {formatTime(callSeconds)}
      </div>
      {!callActive ? (
        <button
          onClick={onStartCall}
          className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center bg-success text-success-foreground transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_0_16px_hsl(152_69%_41%/0.35)] active:scale-100"
        >
          <Phone size={15} strokeWidth={2.2} />
        </button>
      ) : (
        <button
          onClick={onEndCall}
          className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center bg-destructive text-destructive-foreground transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_0_16px_hsl(0_72%_51%/0.35)] active:scale-100"
        >
          <PhoneOff size={15} strokeWidth={2.2} />
        </button>
      )}
      <div className="flex-1" />
      <button onClick={onActivity} className="btn-primary-smooth flex items-center gap-1.5 text-[13px] py-2 px-4">
        <Activity size={14} strokeWidth={2} />
        Aktivitet
      </button>
      <button className="text-muted-foreground/50 hover:text-foreground transition-colors duration-150 cursor-pointer bg-transparent border-none flex items-center gap-1 text-[13px]">
        Mere <ChevronDown size={14} />
      </button>
    </div>
  );
};
