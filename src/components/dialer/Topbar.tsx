import React, { useState } from 'react';
import { Lead } from '@/types/leads';
import { Phone, PhoneOff, Keyboard, X } from 'lucide-react';

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
  onStartCall, onEndCall,
}) => {
  const [showManualDial, setShowManualDial] = useState(false);
  const [manualNumber, setManualNumber] = useState('');

  const dialNumber = (number: string) => {
    if (!number) return;
    // Open tel: link to initiate the call via phone/Skype/Teams
    window.open(`tel:${number.replace(/\s/g, '')}`, '_self');
    // Also start the internal timer
    onStartCall();
  };

  const handleCallLead = () => {
    if (currentLead?.phone) {
      dialNumber(currentLead.phone);
    }
  };

  const handleManualDial = () => {
    if (manualNumber.trim()) {
      dialNumber(manualNumber.trim());
      setManualNumber('');
      setShowManualDial(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleManualDial();
    if (e.key === 'Escape') { setShowManualDial(false); setManualNumber(''); }
  };

  return (
    <div className="h-[56px] bg-card border-b border-border/40 flex items-center px-5 gap-3.5 shrink-0"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      {/* Call status indicator */}
      <div className="flex items-center gap-2.5 bg-background border border-border/50 rounded-lg px-3.5 py-2 font-body text-[13px] font-medium min-w-[180px]">
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
          callActive ? 'bg-success shadow-[0_0_8px_hsl(152_69%_41%/0.5)]' : 'bg-muted-foreground/25'
        }`} />
        <span className="text-foreground/80 tabular-nums">{currentLead?.phone || '—'}</span>
        {currentLead?.company && (
          <span className="text-muted-foreground/50 text-[12px] truncate max-w-[120px]">
            {currentLead.company}
          </span>
        )}
      </div>

      {/* Timer */}
      <div className={`font-heading text-xs font-bold tracking-[0.12em] tabular-nums min-w-[42px] ${
        callActive ? 'text-success' : 'text-primary/80'
      }`}>
        {formatTime(callSeconds)}
      </div>

      {/* Call button for current lead */}
      {currentLead && (
        !callActive ? (
          <button
            onClick={handleCallLead}
            className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center bg-success text-success-foreground transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_0_16px_hsl(152_69%_41%/0.35)] active:scale-100"
            title={`Ring til ${currentLead.phone}`}
          >
            <Phone size={15} strokeWidth={2.2} />
          </button>
        ) : (
          <button
            onClick={onEndCall}
            className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center bg-destructive text-destructive-foreground transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_0_16px_hsl(0_72%_51%/0.35)] active:scale-100 animate-pulse"
            title="Afslut opkald"
          >
            <PhoneOff size={15} strokeWidth={2.2} />
          </button>
        )
      )}

      {/* Manual dial toggle */}
      {!callActive && (
        <button
          onClick={() => setShowManualDial(!showManualDial)}
          className={`w-9 h-9 rounded-full border cursor-pointer flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-100 ${
            showManualDial
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-muted-foreground border-border/50 hover:bg-accent'
          }`}
          title="Indtast nummer manuelt"
        >
          {showManualDial ? <X size={14} strokeWidth={2.2} /> : <Keyboard size={14} strokeWidth={2.2} />}
        </button>
      )}

      {/* Manual number input */}
      {showManualDial && !callActive && (
        <div className="flex items-center gap-2 bg-background border border-border/50 rounded-lg px-3 py-1.5 animate-fade-in">
          <input
            type="tel"
            value={manualNumber}
            onChange={e => setManualNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Indtast nummer..."
            className="bg-transparent border-none outline-none text-[13px] font-medium w-[160px] text-foreground placeholder:text-muted-foreground/40"
            autoFocus
          />
          <button
            onClick={handleManualDial}
            disabled={!manualNumber.trim()}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
              manualNumber.trim()
                ? 'bg-success text-success-foreground cursor-pointer hover:scale-105'
                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
            }`}
            title="Ring til nummer"
          >
            <Phone size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* Call status badge */}
      {callActive && (
        <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3 py-1.5 text-[12px] font-medium text-success">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Opkald i gang
        </div>
      )}

      {currentLead && !callActive && !showManualDial && (
        <div className="text-[12px] text-muted-foreground/50 flex items-center gap-1.5">
          <Phone size={12} strokeWidth={1.8} />
          Klar til opkald
        </div>
      )}
    </div>
  );
};
