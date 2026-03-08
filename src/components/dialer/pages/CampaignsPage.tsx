import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CSVUploadModal } from '@/components/dialer/CSVUploadModal';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  leadCount?: number;
}

interface CampaignsPageProps {
  onNavigate: (page: string) => void;
  showNotif: (msg: string) => void;
  onSelectCampaign: (id: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate, showNotif, onSelectCampaign }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCSV, setShowCSV] = useState(false);
  const [selectedCampaignForCSV, setSelectedCampaignForCSV] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (data) {
      const withCounts = await Promise.all(data.map(async c => {
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', c.id);
        return { ...c, leadCount: count ?? 0 };
      }));
      setCampaigns(withCounts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCSVImport = async (leads: Array<{ company: string; phone: string; email: string; website: string }>) => {
    if (!selectedCampaignForCSV) return;

    const rows = leads.map(l => ({
      campaign_id: selectedCampaignForCSV,
      company: l.company,
      phone: l.phone,
      email: l.email,
      website: l.website,
    }));

    const { error } = await supabase.from('leads').insert(rows);
    if (error) {
      showNotif('❌ Fejl ved import');
      return;
    }

    showNotif(`📥 ${leads.length} emner importeret!`);
    setShowCSV(false);
    fetchCampaigns();
  };

  const openCSVForCampaign = (campaignId: string) => {
    setSelectedCampaignForCSV(campaignId);
    setShowCSV(true);
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-fade-in">Indlæser kampagner...</div>;

  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-[26px] tracking-tight">📋 Kampagner</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {campaigns.map(c => (
          <div key={c.id} className="card-surface hover-lift rounded-2xl p-6 cursor-pointer" onClick={() => { onSelectCampaign(c.id); onNavigate('dialer'); }}>
            <div className="font-heading font-bold text-base mb-2 tracking-tight">{c.name}</div>
            <div className="text-sm text-muted-foreground mb-5">{c.description || 'Ingen beskrivelse'}</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-background rounded-xl px-3.5 py-3">
                <div className="text-[11px] text-muted-foreground font-medium">Emner</div>
                <div className="font-heading font-bold text-lg text-primary mt-0.5">{c.leadCount}</div>
              </div>
              <div className="bg-background rounded-xl px-3.5 py-3">
                <div className="text-[11px] text-muted-foreground font-medium">Oprettet</div>
                <div className="font-heading font-bold text-sm text-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString('da-DK')}</div>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); openCSVForCampaign(c.id); }}
              className="btn-ghost-smooth text-xs w-full flex items-center justify-center gap-2"
            >
              📂 Importer CSV
            </button>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="card-surface rounded-2xl p-10 text-center col-span-full">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-muted-foreground text-sm">Ingen kampagner endnu — kontakt en admin for at oprette en.</div>
          </div>
        )}
      </div>

      <CSVUploadModal
        open={showCSV}
        onClose={() => setShowCSV(false)}
        onImport={handleCSVImport}
      />
    </div>
  );
};
