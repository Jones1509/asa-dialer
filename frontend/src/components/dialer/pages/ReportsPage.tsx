import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Phone, ShoppingCart, RefreshCw, Clock, BarChart3, Target, PhoneOff, Calendar } from 'lucide-react';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/shell/states';

interface ReportsPageProps {
  totalCalls: number;
  totalSales: number;
  totalRecalls: number;
  totalClosed: number;
  formatTotalTime: () => string;
}

interface DailyStats {
  total_calls: number;
  total_sales: number;
  total_callbacks: number;
  total_no_answer: number;
  total_not_interested: number;
  total_duration: number;
  avg_duration: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  totalCalls, totalSales, totalRecalls, totalClosed, formatTotalTime,
}) => {
  const { user } = useAuth();
  const [dbStats, setDbStats] = useState<DailyStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoading(true);
      setFailed(false);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: callLogs, error } = await supabase
        .from('call_logs')
        .select('*, leads(company, phone)')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) setFailed(true);
      if (callLogs) {
        const stats: DailyStats = {
          total_calls: callLogs.length,
          total_sales: callLogs.filter(c => c.result === 'sale').length,
          total_callbacks: callLogs.filter(c => c.result === 'callback').length,
          total_no_answer: callLogs.filter(c => c.result === 'no_answer').length,
          total_not_interested: callLogs.filter(c => c.result === 'not_interested').length,
          total_duration: callLogs.reduce((sum, c) => sum + (c.duration_seconds || 0), 0),
          avg_duration: callLogs.length > 0
            ? Math.round(callLogs.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / callLogs.length)
            : 0,
        };
        setDbStats(stats);
        setRecentCalls(callLogs.slice(0, 10));
      }
      setLoading(false);
    };
    fetchStats();
  }, [user, reloadKey]);

  const formatDuration = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const calls = dbStats?.total_calls ?? totalCalls;
  const sales = dbStats?.total_sales ?? totalSales;
  const conversionRate = calls > 0 ? Math.round((sales / calls) * 100) : 0;

  const statConfigs = [
    { icon: Phone, label: 'Opkald i dag', value: calls, color: 'bg-primary' },
    { icon: ShoppingCart, label: 'Salg', value: sales, color: 'bg-success' },
    { icon: RefreshCw, label: 'Genopkald', value: dbStats?.total_callbacks ?? totalRecalls, color: 'bg-info' },
    { icon: PhoneOff, label: 'Ingen svar', value: dbStats?.total_no_answer ?? 0, color: 'bg-warning' },
    { icon: Target, label: 'Konvertering', value: `${conversionRate}%`, color: 'bg-success' },
    { icon: Clock, label: 'Gns. samtaletid', value: dbStats ? formatDuration(dbStats.avg_duration) : '—', color: 'bg-primary' },
  ];

  const resultLabels: Record<string, string> = {
    sale: 'Salg', callback: 'Genopkald', not_interested: 'Ej int.',
    no_answer: 'Ingen svar', voicemail: 'Telefonsvarer', wrong_number: 'Forkert nr.',
    interested: 'Interesseret',
  };

  const resultColors: Record<string, string> = {
    sale: 'text-success', callback: 'text-info', not_interested: 'text-destructive',
    no_answer: 'text-warning', voicemail: 'text-muted-foreground', wrong_number: 'text-destructive',
    interested: 'text-primary',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page flex flex-col gap-6">
        <header>
          <h1 className="page-title">Rapporter</h1>
          <p className="page-subtitle flex items-center gap-1.5">
            <Calendar size={16} aria-hidden="true" />
            {new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {statConfigs.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card-surface relative overflow-hidden p-4 sm:p-5">
                <div className={`absolute inset-x-0 top-0 h-0.5 ${s.color}`} aria-hidden="true" />
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Icon size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                </div>
                {loading ? <div className="skeleton h-8 w-16" /> : <div className="text-2xl font-semibold tabular-nums text-navy">{s.value}</div>}
                <div className="mt-0.5 text-sm text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>

        <section className="card-surface overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <BarChart3 size={20} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="section-title">Seneste opkald</h2>
            <span className="ml-auto rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{recentCalls.length}</span>
          </div>
          {loading ? (
            <SkeletonRows rows={4} />
          ) : failed ? (
            <ErrorState title="Kunne ikke hente opkald" onRetry={() => setReloadKey(k => k + 1)} />
          ) : recentCalls.length === 0 ? (
            <EmptyState icon={Phone} title="Ingen opkald i dag" message="Når du gemmer et udfald i Dialeren, dukker opkaldet op her med resultat og samtaletid." />
          ) : (
            <ul className="divide-y divide-border">
              {recentCalls.map(call => (
                <li key={call.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:px-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Phone size={16} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{(call.leads as any)?.company || 'Ukendt'}</div>
                    <div className="text-xs tabular-nums text-muted-foreground">{(call.leads as any)?.phone || '—'}</div>
                  </div>
                  <div className={`text-sm font-semibold ${resultColors[call.result] || 'text-muted-foreground'}`}>
                    {resultLabels[call.result] || call.result}
                  </div>
                  <div className="min-w-[44px] text-right text-sm tabular-nums text-muted-foreground">
                    {formatDuration(call.duration_seconds)}
                  </div>
                  <div className="hidden min-w-[48px] text-right text-xs text-muted-foreground sm:block">
                    {new Date(call.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
