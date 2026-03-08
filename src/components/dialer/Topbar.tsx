import React from 'react';
import { Lead } from '@/types/leads';

interface TopbarProps {
  currentLead: Lead;
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
    <div className="h-[60px] bg-card border-b border-border/50 flex items-center px-6 gap-4 shrink-0"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
      <div className="flex items-center gap-3 bg-background border border-border/50 rounded-xl px-4 py-2 font-body text-[13px] font-medium min-w-[200px]">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
          callActive ? 'bg-success shadow-[0_0_10px_hsl(152_69%_41%/0.5)]' : 'bg-muted-foreground/30'
        }`} />
        <span className="text-foreground/80 tabular-nums">{currentLead.phone}</span>
      </div>
      <div className="font-heading text-xs text-primary font-bold tracking-[0.15em] tabular-nums">
        {formatTime(callSeconds)}
      </div>
      {!callActive ? (
        <button
          onClick={onStartCall}
          className="w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center text-base bg-success text-success-foreground transition-all duration-300 ease-out hover:scale-110 hover:shadow-[0_0_20px_hsl(152_69%_41%/0.4)] active:scale-100"
        >
          📞
        </button>
      ) : (
        <button
          onClick={onEndCall}
          className="w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center text-base bg-destructive text-destructive-foreground transition-all duration-300 ease-out hover:scale-110 hover:shadow-[0_0_20px_hsl(0_72%_51%/0.4)] active:scale-100"
        >
          📵
        </button>
      )}
      <div className="flex-1" />
      <button onClick={onActivity} className="btn-primary-smooth">
        Aktivitet
      </button>
      <span className="text-muted-foreground/60 text-sm ml-1 cursor-pointer hover:text-foreground transition-colors duration-200">Mere ▾</span>
    </div>
  );
};
