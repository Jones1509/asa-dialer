import React from 'react';
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react';

interface IncomingCallOverlayProps {
  from: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({ from, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-ink/60 p-4 backdrop-blur-md animate-fade-in">
      <div role="alertdialog" aria-modal="true" aria-label={`Indgående opkald fra ${from}`} className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-navy-deep p-8 shadow-2xl">
        
        {/* Pulsing icon */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
            <PhoneIncoming size={32} className="text-success" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="absolute inset-0 rounded-full bg-success/30 opacity-20 animate-ping" aria-hidden="true" />
        </div>

        <div className="text-center">
          <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.2em] text-brand-sky">
            Indgående opkald
          </div>
          <div className="break-all font-heading text-2xl font-semibold text-white">
            {from}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-2">
          {/* Reject */}
          <button
            type="button"
            onClick={onReject}
            aria-label="Afvis opkald"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-[filter] duration-150 hover:brightness-110 active:scale-[.98]">
            <PhoneOff size={24} strokeWidth={2} aria-hidden="true" />
          </button>

          {/* Accept */}
          <button
            type="button"
            onClick={onAccept}
            aria-label="Besvar opkald"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg transition-[filter] duration-150 hover:brightness-110 active:scale-[.98]">
            <Phone size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
          Ringer...
        </div>
      </div>
    </div>
  );
};
