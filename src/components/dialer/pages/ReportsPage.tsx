import React from 'react';
import { Phone, ShoppingCart, RefreshCw, TrendingUp, Clock, CheckCircle2, Trophy } from 'lucide-react';

interface ReportsPageProps {
  totalCalls: number;
  totalSales: number;
  totalRecalls: number;
  totalClosed: number;
  formatTotalTime: () => string;
}

const statConfigs = [
  { key: 'calls', icon: Phone, label: 'Opkald', color: 'bg-success' },
  { key: 'sales', icon: ShoppingCart, label: 'Salg', color: 'bg-primary' },
  { key: 'recalls', icon: RefreshCw, label: 'Genopkald', color: 'bg-info' },
  { key: 'long', icon: TrendingUp, label: '5+ min opkald', color: 'bg-warning' },
  { key: 'time', icon: Clock, label: 'Total taletid', color: 'bg-primary' },
  { key: 'closed', icon: CheckCircle2, label: 'Afsluttede', color: 'bg-success' },
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
        <h1 className="font-heading font-bold text-xl tracking-tight">Rapporter</h1>
        <div className="text-[13px] text-muted-foreground/60 mt-1">
          {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {statConfigs.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key}
              className="card-surface rounded-xl p-4 relative overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${s.color}`} />
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Icon size={16} className="text-muted-foreground" strokeWidth={1.8} />
              </div>
              <div className="font-heading font-bold text-2xl tracking-tight">{values[s.key]}</div>
              <div className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>
      <div className="card-surface rounded-xl p-5">
        <div className="font-heading font-bold text-[14px] mb-4 flex items-center gap-2 tracking-tight">
          <Trophy size={16} className="text-warning" strokeWidth={2} />
          Din placering i dag
        </div>
        <div className="flex items-center gap-4 py-2.5">
          <div className="font-heading font-bold text-lg w-8 text-primary">#1</div>
          <div className="flex-1">
            <div className="font-medium text-[14px]">Jonas Rydendahl</div>
            <div className="text-[12px] text-muted-foreground/50 mt-0.5">Ud af 1 brugere</div>
          </div>
          <span className="bg-accent text-accent-foreground rounded-md px-2.5 py-1 text-[11px] font-semibold">Førsteplads</span>
        </div>
      </div>
    </div>
  );
};
