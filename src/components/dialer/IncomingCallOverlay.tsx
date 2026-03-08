import React from 'react';
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react';

interface IncomingCallOverlayProps {
  from: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({ from, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="rounded-3xl p-8 flex flex-col items-center gap-6 min-w-[320px]"
        style={{ background: 'linear-gradient(145deg, hsl(222 47% 11%), hsl(217 33% 15%))', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* Pulsing icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <PhoneIncoming size={32} className="text-green-400" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'rgba(34,197,94,0.3)' }} />
        </div>

        <div className="text-center">
          <div className="text-white/40 text-xs uppercase tracking-[0.2em] font-medium mb-1.5">
            Indgående opkald
          </div>
          <div className="font-heading font-bold text-xl text-white/90 tracking-tight">
            {from}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-2">
          {/* Reject */}
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 hover:scale-105 border-none text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
            <PhoneOff size={24} strokeWidth={2} />
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 hover:scale-105 border-none text-white"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
            <Phone size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-white/30 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Ringer...
        </div>
      </div>
    </div>
  );
};
