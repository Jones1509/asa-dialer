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
  onActiveDialNumberChange?: (number: string | null) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentLead, callActive, callSeconds, formatTime,
  onStartCall, onEndCall,
  twilioStatus = 'loading',
  twilioError,
  onTwilioCall,
  onTwilioHangUp,
  canMakeVoipCall = false,
  onActiveDialNumberChange,
}) => {
  const [showManualDial, setShowManualDial] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [activeDialNumber, _setActiveDialNumber] = useState<string | null>(null);

  const setActiveDialNumber = (num: string | null) => {
    _setActiveDialNumber(num);
    onActiveDialNumberChange?.(num);
  };

  const displayNumber = activeDialNumber || currentLead?.phone || '—';

  // Format number to E.164 (add +45 for Danish numbers without country code)
  const formatE164 = (num: string): string => {
    if (num.startsWith('+')) return num;
    if (num.startsWith('00')) return '+' + num.slice(2);
    // Danish numbers: 8 digits without country code
    if (/^\d{8}$/.test(num)) return '+45' + num;
    return '+' + num;
  };

  // ===== Shared dial function — uses Twilio VoIP for ALL calls =====
  const dialNumber = async (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!cleanNumber) return;
    
    const e164Number = formatE164(cleanNumber);
    setActiveDialNumber(e164Number);
    
    if (onTwilioCall) {
      const success = await onTwilioCall(e164Number);
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

  const voipLabel = twilioStatus === 'ready' ? 'VoIP klar' : twilioStatus === 'loading' ? 'Forbinder…' : 'VoIP utilgængelig';
  const statusIcon = () => {
    switch (twilioStatus) {
      case 'ready': return <Wifi size={16} className="text-success" aria-hidden="true" />;
      case 'loading': return <Loader2 size={16} className="text-muted-foreground animate-spin" aria-hidden="true" />;
      default: return <WifiOff size={16} className="text-destructive" aria-hidden="true" />;
    }
  };

  const isManual = !!activeDialNumber && activeDialNumber !== currentLead?.phone;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2 sm:gap-3 sm:px-5 md:min-h-14">

      {/* Twilio status */}
      <div className="flex items-center gap-1.5" title={twilioError || voipLabel} role="status">
        {statusIcon()}
        <span className={`hidden text-xs sm:inline ${twilioStatus === 'error' || twilioStatus === 'offline' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {voipLabel}
        </span>
        <span className="sr-only sm:hidden">{voipLabel}</span>
      </div>

      {/* Call status indicator */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium sm:max-w-md md:flex-none md:min-w-[240px]">
        <span className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-150 ${callActive ? 'bg-success' : 'bg-muted-foreground/30'}`} aria-hidden="true" />
        <span className="shrink-0 tabular-nums text-foreground">{displayNumber}</span>
        {(currentLead?.company || isManual) && (
          <span className="hidden min-w-0 truncate text-xs font-semibold text-muted-foreground sm:inline">
            {isManual ? 'Manuel' : currentLead?.company}
          </span>
        )}
      </div>

      {/* Timer */}
      <div className={`min-w-[44px] text-sm font-semibold tabular-nums ${callActive ? 'text-success' : 'text-muted-foreground'}`} aria-label="Samtaletid">
        {formatTime(callSeconds)}
      </div>

      {/* === LEAD CALL BUTTON — only visible when manual dial is CLOSED === */}
      {currentLead && !showManualDial && !callActive && (
        <button
          type="button"
          onClick={handleCallLead}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-success-foreground transition-[filter] duration-150 hover:brightness-95 active:scale-[.98] md:h-10 md:w-10 ${
            canMakeVoipCall ? 'bg-success' : 'bg-success/70'
          }`}
          aria-label={`Ring til ${currentLead.phone}`}
          title={`Ring til ${currentLead.phone}`}
        >
          <Phone size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      {/* End call button */}
      {callActive && (
        <button
          type="button"
          onClick={handleEndCall}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-[filter] duration-150 hover:brightness-95 active:scale-[.98] md:h-10 md:w-10"
          aria-label="Afslut opkald"
          title="Afslut opkald"
        >
          <PhoneOff size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      {/* === MANUAL DIAL TOGGLE — completely separate from lead call === */}
      {!callActive && (
        <button
          type="button"
          onClick={() => setShowManualDial(!showManualDial)}
          aria-expanded={showManualDial}
          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-150 md:h-10 md:w-10 ${
            showManualDial
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
          aria-label={showManualDial ? 'Luk manuel indtastning' : 'Indtast nummer manuelt'}
          title="Indtast nummer manuelt"
        >
          {showManualDial ? <X size={20} strokeWidth={2} aria-hidden="true" /> : <Keyboard size={20} strokeWidth={2} aria-hidden="true" />}
        </button>
      )}

      {/* === MANUAL NUMBER INPUT — its own call button === */}
      {showManualDial && !callActive && (
        <div className="order-last flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-1 animate-fade-in sm:order-none sm:w-auto">
          <label htmlFor="manual-number" className="sr-only">Telefonnummer</label>
          <input
            id="manual-number"
            type="tel"
            inputMode="tel"
            value={manualNumber}
            onChange={e => setManualNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Indtast nummer"
            className="min-h-10 min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground sm:w-[180px] sm:flex-none"
            autoFocus
          />
          {/* This button ONLY calls handleManualDial — never handleCallLead */}
          <button
            type="button"
            onClick={handleManualDial}
            disabled={!manualNumber.trim()}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 md:h-9 md:w-9 ${
              manualNumber.trim()
                ? 'cursor-pointer bg-success text-success-foreground hover:brightness-95'
                : 'cursor-not-allowed bg-muted text-muted-foreground'
            }`}
            aria-label={`Ring til ${manualNumber.trim() || 'nummer'}`}
          >
            <Phone size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="hidden flex-1 md:block" />

      {/* Call status badge */}
      {callActive && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
          Opkald i gang
        </div>
      )}

      {currentLead && !callActive && !showManualDial && (
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
          Klar til opkald
        </div>
      )}
    </div>
  );
};
