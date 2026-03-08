import React from 'react';
import { User, Lock, Settings as SettingsIcon } from 'lucide-react';

interface SettingsPageProps {
  tetrisEnabled: boolean;
  onToggleTetris: () => void;
  showNotif: (msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ tetrisEnabled, onToggleTetris, showNotif }) => {
  const [autoCall, setAutoCall] = React.useState(false);

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

      <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
        <div className="font-heading font-bold text-[14px] tracking-tight flex items-center gap-2">
          <User size={15} className="text-muted-foreground" strokeWidth={1.8} />
          Profil
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Fornavn</label>
            <input className="input-clean" defaultValue="Jonas" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Efternavn</label>
            <input className="input-clean" defaultValue="Rydendahl" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-clean">Email</label>
          <input className="input-clean" defaultValue="j.rydendahl@gmail.com" />
        </div>
        <button onClick={() => showNotif('Profil gemt')} className="btn-primary-smooth w-fit text-[13px] py-2 px-4">
          Gem profil
        </button>
      </div>

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
        <div className="flex items-center justify-between py-3.5">
          <div>
            <div className="font-medium text-[13px]">Tetris under opkald</div>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">Vis Tetris mens du venter</p>
          </div>
          <Toggle on={tetrisEnabled} onClick={onToggleTetris} />
        </div>
      </div>

      <div className="card-surface rounded-xl p-5">
        <div className="font-heading font-bold text-[14px] tracking-tight mb-3 flex items-center gap-2">
          <Lock size={15} className="text-muted-foreground" strokeWidth={1.8} />
          Sikkerhed
        </div>
        <div className="flex items-center justify-between py-3.5">
          <div>
            <div className="font-medium text-[13px]">Adgangskode</div>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">Skift din adgangskode</p>
          </div>
          <button className="btn-ghost-smooth text-[12px] py-1.5 px-3">Skift</button>
        </div>
      </div>
    </div>
  );
};
