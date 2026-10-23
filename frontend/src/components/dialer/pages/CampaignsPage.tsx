import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { tabel } from '@/lib/dialer-db';
import { LayoutGrid, RefreshCw, ChevronRight } from 'lucide-react';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/shell/states';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  leadCount?: number;
  newCount?: number;
}

interface CampaignsPageProps {
  onSelectCampaign: (id: string, name: string) => void;
  showNotif: (msg: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onSelectCampaign, showNotif }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    setFailed(false);
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: assignments, error: assignError } = await supabase
      .from(tabel('campaign_users'))
      .select('campaign_id')
      .eq('user_id', user.id);
    if (assignError) throw assignError;

    if (!assignments?.length) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    const campaignIds = assignments.map(a => a.campaign_id);
    const { data, error } = await supabase
      .from(tabel('campaigns'))
      .select('*')
      .in('id', campaignIds)
      .eq('archived', false)
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (data) {
      const withCounts = await Promise.all(data.map(async c => {
        const [{ count }, { count: newCount }] = await Promise.all([
          supabase.from(tabel('leads')).select('*', { count: 'exact', head: true }).eq('campaign_id', c.id),
          supabase.from(tabel('leads')).select('*', { count: 'exact', head: true }).eq('campaign_id', c.id).in('status', ['new', 'no_answer', 'callback']),
        ]);
        return { ...c, leadCount: count ?? 0, newCount: newCount ?? 0 };
      }));
      setCampaigns(withCounts);
    }
    } catch {
      setFailed(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page flex flex-col gap-6">
        <header>
          <h1 className="page-title">Mine kampagner</h1>
          <p className="page-subtitle">Vælg en kampagne for at hente emner til dialeren.</p>
        </header>

        {loading ? (
          <SkeletonCards count={3} height="h-44" className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" />
        ) : failed ? (
          <div className="card-surface"><ErrorState title="Kunne ikke hente kampagner" onRetry={fetchCampaigns} /></div>
        ) : campaigns.length === 0 ? (
          <div className="card-surface">
            <EmptyState
              icon={LayoutGrid}
              title="Ingen kampagner endnu"
              message="Du er ikke tildelt nogen kampagner. Bed en administrator om at tildele dig en — så dukker den op her."
              action={{ label: 'Tjek igen', onClick: fetchCampaigns, icon: RefreshCw }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {campaigns.map(c => (
              <button
                type="button"
                key={c.id}
                className="card-surface hover-lift group flex flex-col p-5 text-left"
                onClick={() => onSelectCampaign(c.id, c.name)}
              >
                <div className="flex w-full items-start gap-2">
                  <h2 className="section-title flex-1">{c.name}</h2>
                  <ChevronRight size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary" />
                </div>
                <p className="mb-4 mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description || 'Ingen beskrivelse'}</p>
                <dl className="mt-auto grid w-full grid-cols-3 gap-2">
                  <div className="rounded-lg bg-background px-3 py-2">
                    <dt className="text-xs text-muted-foreground">Emner</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-navy">{c.leadCount}</dd>
                  </div>
                  <div className="rounded-lg bg-background px-3 py-2">
                    <dt className="text-xs text-muted-foreground">At ringe</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-success">{c.newCount}</dd>
                  </div>
                  <div className="rounded-lg bg-background px-3 py-2">
                    <dt className="text-xs text-muted-foreground">Oprettet</dt>
                    <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{new Date(c.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</dd>
                  </div>
                </dl>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
