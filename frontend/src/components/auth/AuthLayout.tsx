import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import asaDialerLogo from '@/assets/asa-dialer-logo.svg';

/**
 * Fælles ramme for login, opret konto, nulstil adgangskode og afventer godkendelse.
 * Mørk navy-flade, Dialerens eget logo + ordmærke, Fraunces/Geist.
 * `kort={false}` (login): intet kort — trekant-layoutet ligger frit under logoet, som ASA-logoets trekant.
 */
export const AuthLayout: React.FC<{ children: React.ReactNode; subtitle?: string; kort?: boolean }> = ({ children, subtitle = 'Kundekommunikation', kort = true }) => {
  // Mørk html/body-baggrund kun på disse ruter, så iOS-overscroll ikke viser en lys kant.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    const ink = 'hsl(var(--navy-ink))';
    html.style.backgroundColor = ink;
    document.body.style.backgroundColor = ink;
    return () => {
      html.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  return (
    <div className="auth-bg relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-12">
      {!kort && (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--blue)/0.08),transparent_70%)]" />
      )}
      <div className={`relative z-10 flex w-full flex-col items-center ${kort ? 'max-w-[420px]' : 'max-w-[480px]'}`}>
        <img src={asaDialerLogo} alt="" className={kort ? 'mb-3 h-24 w-auto sm:h-28' : 'mb-3 h-28 w-auto drop-shadow-[0_4px_32px_hsl(var(--blue)/0.35)]'} />
        <div className="mb-1 font-body text-[22px] font-bold leading-none tracking-[0.2em] text-brand-offwhite" style={{ paddingLeft: '0.2em' }} aria-label="ASA Dialer">
          ASA <span className="text-brand-logo-accent">DIALER</span>
        </div>
        {kort ? (
          <div className="mb-8 text-sm font-medium text-brand-sky">{subtitle}</div>
        ) : (
          <div className="mb-6 mt-1.5 text-[9px] font-semibold uppercase tracking-[0.35em] text-white/35" style={{ paddingLeft: '0.35em' }}>{subtitle}</div>
        )}
        {kort ? (
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            {children}
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  );
};

export const AuthTitle: React.FC<{ title: string; text?: React.ReactNode }> = ({ title, text }) => (
  <div className="mb-6 text-center">
    <h1 className="font-heading text-2xl font-semibold text-white">{title}</h1>
    {text && <p className="mt-2 text-sm leading-relaxed text-white/70">{text}</p>}
  </div>
);

export const AuthError: React.FC<{ message: string }> = ({ message }) => (
  <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm text-destructive-soft">
    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </div>
);
