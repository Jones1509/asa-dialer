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
    <div className="h-14 bg-popover border-b border-border flex items-center px-6 gap-4 shrink-0">
      <div className="flex items-center gap-3 bg-muted border border-border rounded-lg px-3.5 py-1.5 font-heading text-sm font-semibold min-w-[200px]">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
          callActive ? 'bg-success shadow-[0_0_8px_hsl(var(--success))]' : 'bg-muted-foreground/40'
        }`} />
        <span>{currentLead.phone}</span>
      </div>
      <div className="font-heading text-xs text-primary font-bold tracking-wider">
        {formatTime(callSeconds)}
      </div>
      {!callActive ? (
        <button
          onClick={onStartCall}
          className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center text-base bg-success text-success-foreground hover:scale-110 hover:shadow-[0_0_16px_rgba(34,197,94,.5)] transition-all duration-200"
        >
          📞
        </button>
      ) : (
        <button
          onClick={onEndCall}
          className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center text-base bg-destructive text-destructive-foreground hover:scale-110 hover:shadow-[0_0_16px_rgba(239,68,68,.5)] transition-all duration-200"
        >
          📵
        </button>
      )}
      <div className="flex-1" />
      <button
        onClick={onActivity}
        className="bg-primary text-primary-foreground border-none rounded-lg px-4 py-2 font-body font-semibold text-sm cursor-pointer hover:opacity-90 transition-all duration-200"
      >
        Aktivitet
      </button>
      <span className="text-muted-foreground text-sm ml-2">Mere ▾</span>
    </div>
  );
};
