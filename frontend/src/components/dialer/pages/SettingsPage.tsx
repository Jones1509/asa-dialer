import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, Settings as SettingsIcon, Save, Check, Bell, Monitor } from 'lucide-react';

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
    await supabase
      .from('profiles')
      .update({ full_name: fullName, email })
      .eq('user_id', user.id);
    setSaving(false);
    showNotif('Profil opdateret');
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

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-11 h-[24px] rounded-full border-none cursor-pointer relative transition-all duration-200 ease-out ${
        on ? 'bg-primary shadow-[0_1px_6px_hsl(217_91%_60%/0.25)]' : 'bg-secondary'
      }`}
    >
      <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-card shadow-sm transition-all duration-200 ease-out ${
        on ? 'translate-x-[20px]' : ''
      }`} />
    </button>
  );

  return (
    <div className="flex flex-col p-8 gap-5 overflow-y-auto flex-1 max-w-[680px] animate-fade-in">
      <h1 className="font-heading font-bold text-xl tracking-tight">Indstillinger</h1>

      {/* Profile */}
      <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
        <div className="font-heading font-bold text-[14px] tracking-tight flex items-center gap-2">
          <User size={15} className="text-muted-foreground" strokeWidth={1.8} />
          Profil
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Fornavn</label>
            <input className="input-clean" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Efternavn</label>
            <input className="input-clean" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-clean">Email</label>
          <input className="input-clean" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary-smooth w-fit text-[13px] py-2 px-4 flex items-center gap-1.5">
          {saving ? 'Gemmer...' : <><Save size={13} strokeWidth={2} /> Gem profil</>}
        </button>
      </div>

      {/* Dialer settings */}
      <div className="card-surface rounded-xl p-5 flex flex-col gap-0">
        <div className="font-heading font-bold text-[14px] tracking-tight mb-3 flex items-center gap-2">
          <SettingsIcon size={15} className="text-muted-foreground" strokeWidth={1.8} />
          Dialer
        </div>
        <div className="flex items-center justify-between py-3.5 border-b border-border/30">
          <div>
            <div className="font-medium text-[13px]">Automatisk opkald</div>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">Ring automatisk op ved nyt emne</p>
          </div>
          <Toggle on={autoCall} onClick={() => setAutoCall(!autoCall)} />
        </div>
        <div className="flex items-center justify-between py-3.5 border-b border-border/30">
          <div>
            <div className="font-medium text-[13px]">Tetris under opkald</div>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">Spil Tetris mens du venter på svar</p>
          </div>
          <Toggle on={tetrisEnabled} onClick={onToggleTetris} />
        </div>
        <div className="flex items-center justify-between py-3.5">
          <div>
            <div className="font-medium text-[13px]">Notifikationer</div>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">Vis popup-notifikationer</p>
          </div>
          <Toggle on={notifications} onClick={() => setNotifications(!notifications)} />
        </div>
      </div>

      {/* Security */}
      <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
        <div className="font-heading font-bold text-[14px] tracking-tight flex items-center gap-2">
          <Lock size={15} className="text-muted-foreground" strokeWidth={1.8} />
          Sikkerhed
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Ny adgangskode</label>
            <input
              className="input-clean"
              type="password"
              value={passwordNew}
              onChange={e => setPasswordNew(e.target.value)}
              placeholder="Mindst 6 tegn"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={changingPassword || !passwordNew}
            className={`btn-ghost-smooth w-fit text-[12px] py-1.5 px-3 flex items-center gap-1.5 ${!passwordNew ? 'opacity-40' : ''}`}
          >
            <Lock size={12} strokeWidth={2} />
            {changingPassword ? 'Ændrer...' : 'Skift adgangskode'}
          </button>
        </div>
      </div>
    </div>
  );
};
