import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { tabel } from '@/lib/dialer-db';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, Settings as SettingsIcon, Save } from 'lucide-react';

interface SettingsPageProps {
  tetrisEnabled: boolean;
  onToggleTetris: () => void;
  showNotif: (msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ tetrisEnabled, onToggleTetris, showNotif }) => {
  const { profile, user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoCall, setAutoCall] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { error } = await supabase
      .from(tabel('profiles'))
      .update({ full_name: fullName, email })
      .eq('user_id', user.id);
    setSaving(false);
    showNotif(error ? 'Profilen kunne ikke gemmes — prøv igen' : 'Profil opdateret');
  };

  const changePassword = async () => {
    if (passwordNew.length < 6) {
      showNotif('Adgangskoden skal være mindst 6 tegn');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordNew });
    setChangingPassword(false);
    if (error) {
      showNotif('Kunne ikke ændre adgangskode');
    } else {
      showNotif('Adgangskode ændret');
      setPasswordCurrent('');
      setPasswordNew('');
    }
  };

  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors duration-150 ${on ? 'bg-primary' : 'bg-input'}`}>
        <span className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-card shadow-sm transition-transform duration-150 ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );

  const Row = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="page-title">Indstillinger</h1>
          <p className="page-subtitle">Din profil, dialer-præferencer og adgangskode.</p>
        </header>

        {/* Profile */}
        <section className="card-surface flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="section-title flex items-center gap-2">
            <User size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            Profil
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="set-first" className="label-clean">Fornavn</label>
              <input id="set-first" autoComplete="given-name" className="input-clean" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="set-last" className="label-clean">Efternavn</label>
              <input id="set-last" autoComplete="family-name" className="input-clean" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="set-email" className="label-clean">Email</label>
            <input id="set-email" type="email" autoComplete="email" className="input-clean" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button type="button" onClick={saveProfile} disabled={saving} className="btn-primary w-full sm:w-fit">
            <Save size={16} strokeWidth={2} aria-hidden="true" />
            {saving ? 'Gemmer…' : 'Gem profil'}
          </button>
        </section>

        {/* Dialer settings */}
        <section className="card-surface flex flex-col p-5 sm:p-6">
          <h2 className="section-title mb-2 flex items-center gap-2">
            <SettingsIcon size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            Dialer
          </h2>
          <Row title="Automatisk opkald" desc="Ring automatisk op ved nyt emne">
            <Toggle on={autoCall} onClick={() => setAutoCall(!autoCall)} label="Automatisk opkald" />
          </Row>
          <Row title="Tetris under opkald" desc="Spil Tetris mens du venter på svar (kræver tastatur)">
            <Toggle on={tetrisEnabled} onClick={onToggleTetris} label="Tetris under opkald" />
          </Row>
          <Row title="Notifikationer" desc="Vis popup-notifikationer">
            <Toggle on={notifications} onClick={() => setNotifications(!notifications)} label="Notifikationer" />
          </Row>
        </section>

        {/* Security */}
        <section className="card-surface flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="section-title flex items-center gap-2">
            <Lock size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            Sikkerhed
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="set-pw" className="label-clean">Ny adgangskode</label>
            <input
              id="set-pw"
              className="input-clean"
              type="password"
              autoComplete="new-password"
              value={passwordNew}
              onChange={e => setPasswordNew(e.target.value)}
              placeholder="Mindst 6 tegn"
            />
          </div>
          <button
            type="button"
            onClick={changePassword}
            disabled={changingPassword || !passwordNew}
            className="btn-secondary w-full sm:w-fit"
          >
            <Lock size={16} strokeWidth={2} aria-hidden="true" />
            {changingPassword ? 'Ændrer…' : 'Skift adgangskode'}
          </button>
        </section>
      </div>
    </div>
  );
};
