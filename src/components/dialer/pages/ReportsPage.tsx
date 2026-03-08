import React from 'react';

interface ReportsPageProps {
  totalCalls: number;
  totalSales: number;
  totalRecalls: number;
  totalClosed: number;
  formatTotalTime: () => string;
}

const statConfigs = [
  { key: 'calls', icon: '📞', label: 'Opkald', color: 'bg-success' },
  { key: 'sales', icon: '🛒', label: 'Salg', color: 'bg-primary' },
  { key: 'recalls', icon: '🔄', label: 'Genopkald', color: 'bg-pink-500' },
  { key: 'long', icon: '📈', label: '5+ min opkald', color: 'bg-info' },
  { key: 'time', icon: '⏱', label: 'Total taletid', color: 'bg-warning' },
  { key: 'closed', icon: '✅', label: 'Afsluttede', color: 'bg-purple-500' },
];

export const ReportsPage: React.FC<ReportsPageProps> = ({
  totalCalls, totalSales, totalRecalls, totalClosed, formatTotalTime,
}) => {
  const values: Record<string, string | number> = {
    calls: totalCalls,
    sales: totalSales,
    recalls: totalRecalls,
    long: 0,
    time: formatTotalTime(),
    closed: totalClosed,
  };

  return (
    <div className="flex flex-col p-7 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <div>
        <h1 className="font-heading font-extrabold text-2xl">📊 Mine Rapporter</h1>
        <div className="text-sm text-muted-foreground">8. marts 2026</div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {statConfigs.map(s => (
          <div key={s.key} className="card-surface rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl ${s.color}`} />
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="font-heading font-extrabold text-3xl">{values[s.key]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card-surface rounded-xl p-5">
        <div className="font-heading font-bold text-base mb-4 flex items-center gap-2">🏆 Din placering i dag</div>
        <div className="flex items-center gap-3 py-3">
          <div className="font-heading font-extrabold text-lg w-8 text-primary">#1</div>
          <div className="flex-1">
            <div className="font-medium">Jonas Rydendahl</div>
            <div className="text-xs text-muted-foreground">Ud af 1 brugere</div>
          </div>
          <div className="bg-primary/10 text-primary border border-primary/30 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Førsteplads!
          </div>
        </div>
      </div>
    </div>
  );
};
