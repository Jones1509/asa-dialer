import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    // Get user's assigned campaigns via campaign_users
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

  if (loading) return <div className="p-8 text-muted-foreground animate-fade-in">Indlæser kampagner...</div>;

  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-[26px] tracking-tight">📋 Mine Kampagner</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {campaigns.map(c => (
          <div
            key={c.id}
            className="card-surface hover-lift rounded-2xl p-6 cursor-pointer"
            onClick={() => onSelectCampaign(c.id, c.name)}
          >
            <div className="font-heading font-bold text-base mb-2 tracking-tight">{c.name}</div>
            <div className="text-sm text-muted-foreground mb-5">{c.description || 'Ingen beskrivelse'}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background rounded-xl px-3.5 py-3">
                <div className="text-[11px] text-muted-foreground font-medium">Emner</div>
                <div className="font-heading font-bold text-lg text-primary mt-0.5">{c.leadCount}</div>
              </div>
              <div className="bg-background rounded-xl px-3.5 py-3">
                <div className="text-[11px] text-muted-foreground font-medium">At ringe</div>
                <div className="font-heading font-bold text-lg text-success mt-0.5">{c.newCount}</div>
              </div>
              <div className="bg-background rounded-xl px-3.5 py-3">
                <div className="text-[11px] text-muted-foreground font-medium">Oprettet</div>
                <div className="font-heading font-bold text-sm text-foreground mt-1">{new Date(c.created_at).toLocaleDateString('da-DK')}</div>
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="card-surface rounded-2xl p-10 text-center col-span-full">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-muted-foreground text-sm">Du har ingen tildelte kampagner endnu — kontakt en admin.</div>
          </div>
        )}
      </div>
    </div>
  );
};
