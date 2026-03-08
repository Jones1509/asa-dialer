import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  archived: boolean;
}

interface AdminCampaignsTabProps {
  showNotif: (msg: string) => void;
}

export const AdminCampaignsTab: React.FC<AdminCampaignsTabProps> = ({ showNotif }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const createCampaign = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('campaigns').insert({ name: newName, description: newDesc });
    if (error) {
      showNotif('❌ Kunne ikke oprette kampagne');
      return;
    }
    showNotif('✅ Kampagne oprettet!');
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    fetchCampaigns();
  };

  const archiveCampaign = async (id: string) => {
    await supabase.from('campaigns').update({ archived: true }).eq('id', id);
    showNotif('📦 Kampagne arkiveret');
    fetchCampaigns();
  };

  if (loading) return <div className="p-8 text-muted-foreground">Indlæser kampagner...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">📋 Kampagner ({campaigns.length})</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary-smooth text-sm">
          + Ny kampagne
        </button>
      </div>

      {showCreate && (
        <div className="card-surface rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="label-clean">Kampagnenavn</label>
            <input className="input-clean" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Navn på kampagne" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-clean">Beskrivelse</label>
            <textarea className="input-clean resize-none h-20" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Valgfri beskrivelse" />
          </div>
          <div className="flex gap-3">
            <button onClick={createCampaign} className="btn-primary-smooth text-sm">✅ Opret</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost-smooth text-sm">Annuller</button>
          </div>
        </div>
      )}

      <div className="card-surface rounded-2xl overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">Ingen kampagner endnu</div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg">📋</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.description || 'Ingen beskrivelse'}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('da-DK')}</div>
              {c.archived ? (
                <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-1">Arkiveret</span>
              ) : (
                <button onClick={() => archiveCampaign(c.id)} className="btn-ghost-smooth text-xs py-1.5 px-3">📦 Arkiver</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
