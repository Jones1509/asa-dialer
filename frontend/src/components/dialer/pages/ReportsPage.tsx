import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Phone, ShoppingCart, RefreshCw, TrendingUp, Clock, CheckCircle2, Trophy, BarChart3, Target, PhoneOff, Calendar } from 'lucide-react';

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

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: callLogs } = await supabase
        .from('call_logs')
        .select('*, leads(company, phone)')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

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
  }, [user]);

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
    sale: 'text-success', callback: 'text-info', not_interested: 'text-destructive/70',
    no_answer: 'text-warning', voicemail: 'text-muted-foreground', wrong_number: 'text-destructive',
    interested: 'text-primary',
  };

  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl tracking-tight">Rapporter</h1>
          <div className="text-[13px] text-muted-foreground/60 mt-1 flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {statConfigs.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label}
              className="card-surface rounded-xl p-4 relative overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${s.color}`} />
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Icon size={16} className="text-muted-foreground" strokeWidth={1.8} />
              </div>
              <div className="font-heading font-bold text-2xl tracking-tight">{s.value}</div>
              <div className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent calls */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/30 flex items-center gap-2">
          <BarChart3 size={15} className="text-muted-foreground" strokeWidth={1.8} />
          <span className="font-heading font-bold text-[14px] tracking-tight">Seneste opkald</span>
          <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-semibold ml-auto tabular-nums">{recentCalls.length}</span>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-muted-foreground/50 text-[13px]">Indlæser...</div>
        ) : recentCalls.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground/50 text-[13px]">Ingen opkald registreret i dag</div>
        ) : (
          <div className="divide-y divide-border/20">
            {recentCalls.map(call => (
              <div key={call.id} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors duration-100">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-muted-foreground" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {(call.leads as any)?.company || 'Ukendt'}
                  </div>
                  <div className="text-[11px] text-muted-foreground/50 tabular-nums">
                    {(call.leads as any)?.phone || '—'}
                  </div>
                </div>
                <div className={`text-[11px] font-semibold ${resultColors[call.result] || 'text-muted-foreground'}`}>
                  {resultLabels[call.result] || call.result}
                </div>
                <div className="text-[11px] text-muted-foreground/50 tabular-nums min-w-[40px] text-right">
                  {formatDuration(call.duration_seconds)}
                </div>
                <div className="text-[10px] text-muted-foreground/40 min-w-[48px] text-right">
                  {new Date(call.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
