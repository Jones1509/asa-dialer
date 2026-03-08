import React from 'react';

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
      className={`w-12 h-[26px] rounded-full border-none cursor-pointer relative transition-all duration-300 ease-out ${
        on ? 'bg-primary shadow-[0_2px_8px_hsl(217_91%_60%/0.3)]' : 'bg-secondary'
      }`}
    >
      <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-card shadow-sm transition-all duration-300 ease-out ${
        on ? 'translate-x-[22px]' : ''
      }`} />
    </button>
  );

  return (
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 max-w-[720px] animate-fade-in">
      <h1 className="font-heading font-extrabold text-[26px] tracking-tight">⚙️ Indstillinger</h1>

      <div className="card-surface rounded-2xl p-6 flex flex-col gap-5">
        <div className="font-heading font-bold text-[15px] tracking-tight">Profil</div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="label-clean">Fornavn</label>
            <input className="input-clean" defaultValue="Jonas" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-clean">Efternavn</label>
            <input className="input-clean" defaultValue="Rydendahl" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Email</label>
          <input className="input-clean" defaultValue="j.rydendahl@gmail.com" />
        </div>
        <button onClick={() => showNotif('💾 Profil gemt!')} className="btn-primary-smooth w-fit">
          💾 Gem profil
        </button>
      </div>

      <div className="card-surface rounded-2xl p-6 flex flex-col gap-1">
        <div className="font-heading font-bold text-[15px] tracking-tight mb-3">Dialer</div>
        <div className="flex items-center justify-between py-4 border-b border-border/40">
          <div>
            <div className="font-medium text-sm">Automatisk opkald</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Ring automatisk op når et nyt emne vises</p>
          </div>
          <Toggle on={autoCall} onClick={() => setAutoCall(!autoCall)} />
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="font-medium text-sm">Tetris under opkald</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Vis Tetris mens du venter på svar</p>
          </div>
          <Toggle on={tetrisEnabled} onClick={onToggleTetris} />
        </div>
      </div>

      <div className="card-surface rounded-2xl p-6 flex flex-col gap-1">
        <div className="font-heading font-bold text-[15px] tracking-tight mb-3">Sikkerhed</div>
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="font-medium text-sm">Adgangskode</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Skift din adgangskode</p>
          </div>
          <button className="btn-ghost-smooth text-[13px] py-1.5 px-4">Skift</button>
        </div>
      </div>
    </div>
  );
};
