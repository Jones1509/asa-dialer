import React from 'react';

interface SettingsPageProps {
  tetrisEnabled: boolean;
  onToggleTetris: () => void;
  showNotif: (msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ tetrisEnabled, onToggleTetris, showNotif }) => {
  const [autoCall, setAutoCall] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-11 h-6 rounded-full border-none cursor-pointer relative transition-colors duration-200 ${on ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-popover transition-transform duration-200 ${on ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="flex flex-col p-7 gap-5 overflow-y-auto flex-1 max-w-[700px] animate-fade-in">
      <h1 className="font-heading font-extrabold text-2xl">⚙️ Indstillinger</h1>

      <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
        <div className="font-heading font-bold text-base">Profil</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fornavn</label>
            <input className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary/40" defaultValue="J.rydendahl@gmail.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Efternavn</label>
            <input className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary/40" defaultValue="Jonas Rydendahl" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</label>
          <input className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary/40" defaultValue="j.rydendahl@gmail.com" />
        </div>
        <button
          onClick={() => showNotif('💾 Profil gemt!')}
          className="bg-primary text-primary-foreground border-none rounded-lg py-3 font-body font-semibold text-sm cursor-pointer hover:opacity-90 transition-all duration-200"
        >
          💾 Gem profil
        </button>
      </div>

      <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
        <div className="font-heading font-bold text-base">Dialer</div>
        <div className="flex items-center justify-between py-2.5 border-b border-border">
          <div>
            <div className="font-medium text-sm">Automatisk opkald</div>
            <p className="text-xs text-muted-foreground mt-0.5">Ring automatisk op når et nyt emne vises</p>
          </div>
          <Toggle on={autoCall} onClick={() => setAutoCall(!autoCall)} />
        </div>
        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="font-medium text-sm">Tetris under opkald</div>
            <p className="text-xs text-muted-foreground mt-0.5">Vis Tetris mens du venter på svar</p>
          </div>
          <Toggle on={tetrisEnabled} onClick={onToggleTetris} />
        </div>
      </div>

      <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
        <div className="font-heading font-bold text-base">Sikkerhed</div>
        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="font-medium text-sm">Adgangskode</div>
            <p className="text-xs text-muted-foreground mt-0.5">Skift din adgangskode</p>
          </div>
          <button className="bg-transparent border border-border rounded-lg px-4 py-1.5 text-sm text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-primary transition-all duration-200">
            Skift
          </button>
        </div>
      </div>
    </div>
  );
};
