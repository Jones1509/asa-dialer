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
  { key: 'recalls', icon: '🔄', label: 'Genopkald', color: 'bg-info' },
  { key: 'long', icon: '📈', label: '5+ min opkald', color: 'bg-warning' },
  { key: 'time', icon: '⏱', label: 'Total taletid', color: 'bg-primary' },
  { key: 'closed', icon: '✅', label: 'Afsluttede', color: 'bg-success' },
];

export const ReportsPage: React.FC<ReportsPageProps> = ({
  totalCalls, totalSales, totalRecalls, totalClosed, formatTotalTime,
}) => {
  const values: Record<string, string | number> = {
    calls: totalCalls, sales: totalSales, recalls: totalRecalls,
    long: 0, time: formatTotalTime(), closed: totalClosed,
  };

  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div>
        <h1 className="font-heading font-extrabold text-[26px] tracking-tight">📊 Mine Rapporter</h1>
        <div className="text-sm text-muted-foreground mt-1">8. marts 2026</div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
        {statConfigs.map((s, i) => (
          <div key={s.key}
            className="card-surface rounded-2xl p-5 relative overflow-hidden animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl ${s.color}`} />
            <div className="text-xl mb-2.5">{s.icon}</div>
            <div className="font-heading font-extrabold text-[28px] tracking-tight">{values[s.key]}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card-surface rounded-2xl p-6">
        <div className="font-heading font-bold text-[15px] mb-5 flex items-center gap-2 tracking-tight">🏆 Din placering i dag</div>
        <div className="flex items-center gap-4 py-3">
          <div className="font-heading font-extrabold text-xl w-8 text-primary">#1</div>
          <div className="flex-1">
            <div className="font-medium text-[15px]">Jonas Rydendahl</div>
            <div className="text-xs text-muted-foreground mt-0.5">Ud af 1 brugere</div>
          </div>
          <div className="badge-clean">Førsteplads!</div>
        </div>
      </div>
    </div>
  );
};
