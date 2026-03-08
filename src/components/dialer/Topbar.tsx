import React, { useState } from 'react';
import { Lead } from '@/types/leads';
import { Phone, PhoneOff, Keyboard, X, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface TopbarProps {
  currentLead: Lead | null;
  callActive: boolean;
  callSeconds: number;
  formatTime: (s: number) => string;
  onStartCall: () => void;
  onEndCall: () => void;
  onActivity: () => void;
  twilioStatus?: 'loading' | 'ready' | 'error' | 'offline';
  twilioError?: string | null;
  onTwilioCall?: (number: string) => Promise<boolean>;
  onTwilioHangUp?: () => void;
  canMakeVoipCall?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentLead, callActive, callSeconds, formatTime,
  onStartCall, onEndCall,
  twilioStatus = 'loading',
  twilioError,
  onTwilioCall,
  onTwilioHangUp,
  canMakeVoipCall = false,
}) => {
  const [showManualDial, setShowManualDial] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [activeDialNumber, setActiveDialNumber] = useState<string | null>(null);

  const displayNumber = activeDialNumber || currentLead?.phone || '—';

  // ===== Shared dial function — uses Twilio VoIP for ALL calls =====
  const dialNumber = async (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!cleanNumber) return;
    
    setActiveDialNumber(cleanNumber);
    
    if (onTwilioCall) {
      const success = await onTwilioCall(cleanNumber);
      if (success) {
        onStartCall();
        return;
      }
    }
    // Fallback to tel: only if Twilio is completely unavailable
    window.location.href = `tel:${cleanNumber}`;
    onStartCall();
  };

  // ===== LEAD CALL =====
  const handleCallLead = () => {
    if (!currentLead?.phone) return;
    dialNumber(currentLead.phone);
  };

  // ===== MANUAL CALL — uses same Twilio VoIP as lead calls =====
  const handleManualDial = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const numberToDial = manualNumber.trim().replace(/\s/g, '');
    if (!numberToDial) return;
    
    setManualNumber('');
    setShowManualDial(false);
    dialNumber(numberToDial);
  };

  const handleEndCall = () => {
    if (onTwilioHangUp) onTwilioHangUp();
    onEndCall();
    setActiveDialNumber(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const numberToDial = manualNumber.trim().replace(/\s/g, '');
      if (!numberToDial) return;
      setManualNumber('');
      setShowManualDial(false);
      dialNumber(numberToDial);
    }
    if (e.key === 'Escape') { setShowManualDial(false); setManualNumber(''); }
  };

  const statusIcon = () => {
    switch (twilioStatus) {
      case 'ready': return <Wifi size={12} className="text-success" />;
      case 'loading': return <Loader2 size={12} className="text-muted-foreground animate-spin" />;
      default: return <WifiOff size={12} className="text-destructive" />;
    }
  };

  return (
    <div className="h-[56px] bg-card border-b border-border/40 flex items-center px-5 gap-3.5 shrink-0"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      
      {/* Twilio status */}
      <div className="flex items-center gap-1.5" title={twilioError || `VoIP: ${twilioStatus}`}>
        {statusIcon()}
        <span className="text-[11px] text-muted-foreground/60">
          {twilioStatus === 'ready' ? 'VoIP' : twilioStatus === 'loading' ? 'Forbinder...' : 'Offline'}
        </span>
      </div>

      {/* Call status indicator */}
      <div className="flex items-center gap-2.5 bg-background border border-border/50 rounded-lg px-3.5 py-2 font-body text-[13px] font-medium min-w-[180px]">
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
          callActive ? 'bg-success shadow-[0_0_8px_hsl(152_69%_41%/0.5)]' : 'bg-muted-foreground/25'
        }`} />
        <span className="text-foreground/80 tabular-nums">{displayNumber}</span>
        {!activeDialNumber && currentLead?.company && (
          <span className="text-muted-foreground/50 text-[12px] truncate max-w-[120px]">
            {currentLead.company}
          </span>
        )}
        {activeDialNumber && activeDialNumber !== currentLead?.phone && (
          <span className="text-muted-foreground/50 text-[12px]">Manuel</span>
        )}
      </div>

      {/* Timer */}
      <div className={`font-heading text-xs font-bold tracking-[0.12em] tabular-nums min-w-[42px] ${
        callActive ? 'text-success' : 'text-primary/80'
      }`}>
        {formatTime(callSeconds)}
      </div>

      {/* === LEAD CALL BUTTON — only visible when manual dial is CLOSED === */}
      {currentLead && !showManualDial && !callActive && (
        <button
          onClick={handleCallLead}
          className={`w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-100 ${
            canMakeVoipCall
              ? 'bg-success text-success-foreground hover:shadow-[0_0_16px_hsl(152_69%_41%/0.35)]'
              : 'bg-success/60 text-success-foreground'
          }`}
          title={`Ring til ${currentLead.phone}`}
        >
          <Phone size={15} strokeWidth={2.2} />
        </button>
      )}

      {/* End call button */}
      {callActive && (
        <button
          onClick={handleEndCall}
          className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center bg-destructive text-destructive-foreground transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_0_16px_hsl(0_72%_51%/0.35)] active:scale-100 animate-pulse"
          title="Afslut opkald"
        >
          <PhoneOff size={15} strokeWidth={2.2} />
        </button>
      )}

      {/* === MANUAL DIAL TOGGLE — completely separate from lead call === */}
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

      {/* === MANUAL NUMBER INPUT — its own call button === */}
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
          {/* This button ONLY calls handleManualDial — never handleCallLead */}
          <button
            onClick={handleManualDial}
            disabled={!manualNumber.trim()}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
              manualNumber.trim()
                ? 'bg-success text-success-foreground cursor-pointer hover:scale-105'
                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
            }`}
            title={`Ring til ${manualNumber.trim() || '...'}`}
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
