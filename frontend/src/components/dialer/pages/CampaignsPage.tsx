import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/backend-stub';
import { LayoutGrid, Users, Clock } from 'lucide-react';

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

  const fetchCampaigns = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: assignments } = await supabase
      .from('campaign_users')
      .select('campaign_id')
      .eq('user_id', user.id);

    if (!assignments?.length) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    const campaignIds = assignments.map(a => a.campaign_id);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .in('id', campaignIds)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (data) {
      const withCounts = await Promise.all(data.map(async c => {
        const [{ count }, { count: newCount }] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id),
          supabase.from('leads').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id).in('status', ['new', 'no_answer', 'callback']),
        ]);
        return { ...c, leadCount: count ?? 0, newCount: newCount ?? 0 };
      }));
      setCampaigns(withCounts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  if (loading) return <div className="p-8 text-muted-foreground/60 text-[13px] animate-fade-in">Indlæser kampagner...</div>;

  return (
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <h1 className="font-heading font-bold text-xl tracking-tight">Mine Kampagner</h1>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {campaigns.map(c => (
          <div
            key={c.id}
            className="card-surface hover-lift rounded-xl p-5 cursor-pointer"
            onClick={() => onSelectCampaign(c.id, c.name)}
          >
            <div className="font-heading font-bold text-[14px] mb-1 tracking-tight">{c.name}</div>
            <div className="text-[13px] text-muted-foreground/50 mb-4">{c.description || 'Ingen beskrivelse'}</div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-background rounded-lg px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Emner</div>
                <div className="font-heading font-bold text-base text-primary mt-0.5">{c.leadCount}</div>
              </div>
              <div className="bg-background rounded-lg px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">At ringe</div>
                <div className="font-heading font-bold text-base text-success mt-0.5">{c.newCount}</div>
              </div>
              <div className="bg-background rounded-lg px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Dato</div>
                <div className="font-heading font-bold text-[12px] text-foreground/70 mt-1">{new Date(c.created_at).toLocaleDateString('da-DK')}</div>
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="card-surface rounded-xl p-10 text-center col-span-full flex flex-col items-center gap-3">
            <LayoutGrid size={36} className="text-muted-foreground/25" strokeWidth={1.2} />
            <div className="text-muted-foreground/50 text-[13px]">Du har ingen tildelte kampagner — kontakt en admin.</div>
          </div>
        )}
      </div>
    </div>
  );
};
