import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Inbox, Phone, Mail, MapPin, RefreshCw, MessageSquare } from 'lucide-react';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/shell/states';

/**
 * Indbakke (Jonas 23. okt 2026): alt kunder skriver på asa-el.dk lander her —
 * "Få et tilbud", Elio-chatten, kontaktformularen, autorisation, booking og alle fremtidige formularer.
 * Kilden er business.henvendelser (samme række som KLS → Henvendelser), overskriften står i samtale_log.formular.
 */

interface Henvendelse {
  id: string;
  kunde_navn: string | null;
  kunde_telefon: string | null;
  kunde_email: string | null;
  kunde_adresse: string | null;
  beskrivelse: string;
  status: string;
  reference_nummer: string | null;
  created_at: string;
  samtale_log: { formular?: string; kilde?: string } | null;
}

interface Booking {
  id: string;
  kunde_navn: string;
  kunde_telefon: string;
  kunde_email: string;
  kunde_adresse: string | null;
  beskrivelse: string | null;
  status: string;
  start_tid: string;
  created_at: string;
}

// Bookinger fra /booking står i public.bookinger (vises også i KLS-kalenderen) — her som en række med overskriften "Booking"
function fraBooking(b: Booking): Henvendelse {
  const tidspunkt = new Date(b.start_tid).toLocaleString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  return {
    id: `booking-${b.id}`,
    kunde_navn: b.kunde_navn,
    kunde_telefon: b.kunde_telefon,
    kunde_email: b.kunde_email,
    kunde_adresse: b.kunde_adresse,
    beskrivelse: `Booket besigtigelse: ${tidspunkt}${b.beskrivelse ? `\n\n${b.beskrivelse}` : ''}`,
    status: b.status === 'aflyst' ? 'aflyst' : 'booket',
    reference_nummer: null,
    created_at: b.created_at,
    samtale_log: { formular: 'Booking' },
  };
}

// Ældre rækker (før overskriften blev gemt) får en overskrift ud fra kilden
function overskrift(h: Henvendelse): string {
  const log = h.samtale_log ?? {};
  if (log.formular) return log.formular;
  if (h.beskrivelse.startsWith('[Autorisation')) return 'Autorisation';
  if (log.kilde === 'kontaktformular') return 'Kontaktformular';
  if (log.kilde?.startsWith('hjemmeside')) return 'Elio-chat';
  return 'Henvendelse';
}

const erKladde = (h: Henvendelse) => h.samtale_log?.kilde === 'hjemmeside_draft' && !h.kunde_telefon && !h.kunde_email;

const STATUS: Record<string, { tekst: string; klasse: string }> = {
  ny: { tekst: 'Ny', klasse: 'bg-primary/10 text-primary' },
  godkendt: { tekst: 'Godkendt i KLS', klasse: 'bg-success/15 text-success' },
  afvist: { tekst: 'Afvist', klasse: 'bg-secondary text-muted-foreground' },
  booket: { tekst: 'Tid booket', klasse: 'bg-success/15 text-success' },
  aflyst: { tekst: 'Aflyst', klasse: 'bg-secondary text-muted-foreground' },
};

function tid(iso: string): string {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'lige nu';
  if (min < 60) return `${min} min siden`;
  if (min < 60 * 24) return `${Math.round(min / 60)} t siden`;
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

export const IndbakkePage: React.FC = () => {
  const [rows, setRows] = useState<Henvendelse[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<string>('Alle');
  const [visKladder, setVisKladder] = useState(false);

  const hent = useCallback(async (stille = false) => {
    if (!stille) setLoading(true);
    setFailed(false);
    const [henv, book] = await Promise.all([
      supabase
        .schema('business')
        .from('henvendelser')
        .select('id, kunde_navn, kunde_telefon, kunde_email, kunde_adresse, beskrivelse, status, reference_nummer, created_at, samtale_log')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('bookinger')
        .select('id, kunde_navn, kunde_telefon, kunde_email, kunde_adresse, beskrivelse, status, start_tid, created_at')
        .eq('kilde', 'hjemmeside')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (henv.error) setFailed(true);
    else {
      // Bookinger kræver admin-adgang — uden den vises bare henvendelserne
      const bookinger = book.error ? [] : ((book.data ?? []) as Booking[]).map(fraBooking);
      setRows([...(henv.data ?? []) as Henvendelse[], ...bookinger].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    }
    setLoading(false);
  }, []);

  // Nye henvendelser dukker op af sig selv (realtime på business.henvendelser)
  useEffect(() => {
    hent();
    const kanal = supabase
      .channel('indbakke-henvendelser')
      .on('postgres_changes', { event: '*', schema: 'business', table: 'henvendelser' }, () => hent(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookinger' }, () => hent(true))
      .subscribe();
    return () => { supabase.removeChannel(kanal); };
  }, [hent]);

  const synlige = useMemo(() => rows.filter(h => visKladder || !erKladde(h)), [rows, visKladder]);
  const formularer = useMemo(() => ['Alle', ...Array.from(new Set(synlige.map(overskrift)))], [synlige]);
  const viste = filter === 'Alle' ? synlige : synlige.filter(h => overskrift(h) === filter);
  const antalKladder = rows.filter(erKladde).length;
  const antalNye = synlige.filter(h => h.status === 'ny').length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Indbakke</h1>
            <p className="page-subtitle">Alt, kunder skriver på asa-el.dk — med overskrift for hvilken formular de skrev fra.</p>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => hent()}>
            <RefreshCw size={16} strokeWidth={2} aria-hidden="true" /> Opdatér
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrér efter formular">
          {formularer.map(f => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${filter === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
            >
              {f}{f === 'Alle' && antalNye > 0 ? ` · ${antalNye} nye` : ''}
            </button>
          ))}
          {antalKladder > 0 && (
            <label className="ml-auto flex items-center gap-2 text-[13px] text-muted-foreground">
              <input type="checkbox" checked={visKladder} onChange={e => setVisKladder(e.target.checked)} />
              Vis {antalKladder} chat{antalKladder === 1 ? '' : 's'} uden kontaktoplysninger
            </label>
          )}
        </div>

        <section className="card-surface overflow-hidden">
          {loading ? (
            <SkeletonRows rows={5} />
          ) : failed ? (
            <ErrorState message="Indbakken kunne ikke hentes. Har din konto adgang til henvendelser? Prøv igen, eller kontakt Jonas." onRetry={() => hent()} />
          ) : viste.length === 0 ? (
            <EmptyState icon={Inbox} title="Ingen henvendelser endnu" message="Når en kunde skriver i en formular eller i Elio-chatten på asa-el.dk, dukker det op her med det samme." />
          ) : (
            <ul className="divide-y divide-border">
              {viste.map(h => {
                const st = STATUS[h.status] ?? { tekst: h.status, klasse: 'bg-secondary text-muted-foreground' };
                return (
                  <li key={h.id} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-navy px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-white">{overskrift(h)}</span>
                      <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${st.klasse}`}>{st.tekst}</span>
                      {erKladde(h) && <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[12px] font-medium text-warning">Chat i gang</span>}
                      <span className="ml-auto text-[13px] text-muted-foreground">{tid(h.created_at)}{h.reference_nummer ? ` · ${h.reference_nummer}` : ''}</span>
                    </div>
                    <div className="font-heading text-base font-bold text-navy">{h.kunde_navn || 'Ukendt kunde'}</div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{h.beskrivelse}</p>
                    <div className="flex flex-wrap gap-2">
                      {h.kunde_telefon && (
                        <a className="btn-primary btn-sm" href={`tel:${h.kunde_telefon.replace(/\s/g, '')}`}>
                          <Phone size={16} strokeWidth={2} aria-hidden="true" /> {h.kunde_telefon}
                        </a>
                      )}
                      {h.kunde_email && (
                        <a className="btn-secondary btn-sm" href={`mailto:${h.kunde_email}`}>
                          <Mail size={16} strokeWidth={2} aria-hidden="true" /> {h.kunde_email}
                        </a>
                      )}
                      {h.kunde_adresse && (
                        <span className="inline-flex items-center gap-1.5 px-1 text-[13px] text-muted-foreground">
                          <MapPin size={16} strokeWidth={1.75} aria-hidden="true" /> {h.kunde_adresse}
                        </span>
                      )}
                      {!h.kunde_telefon && !h.kunde_email && (
                        <span className="inline-flex items-center gap-1.5 px-1 text-[13px] text-muted-foreground">
                          <MessageSquare size={16} strokeWidth={1.75} aria-hidden="true" /> Ingen kontaktoplysninger endnu
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
