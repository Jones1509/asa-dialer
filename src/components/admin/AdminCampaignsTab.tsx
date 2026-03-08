import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CSVUploadModal } from '@/components/dialer/CSVUploadModal';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  archived: boolean;
  leadCount?: number;
  assignedUsers?: { user_id: string; full_name: string; email: string }[];
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

interface AdminCampaignsTabProps {
  showNotif: (msg: string) => void;
}

export const AdminCampaignsTab: React.FC<AdminCampaignsTabProps> = ({ showNotif }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showCSV, setShowCSV] = useState(false);
  const [csvCampaignId, setCsvCampaignId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const fetchAll = async () => {
    const [{ data: campaignsData }, { data: profilesData }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, full_name, email').eq('approved', true),
    ]);

    const enriched = await Promise.all((campaignsData ?? []).map(async c => {
      const [{ count }, { data: cuData }] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id),
        supabase.from('campaign_users').select('user_id').eq('campaign_id', c.id),
      ]);
      const assignedUserIds = (cuData ?? []).map(cu => cu.user_id);
      const assignedUsers = (profilesData ?? []).filter(p => assignedUserIds.includes(p.user_id));
      return { ...c, leadCount: count ?? 0, assignedUsers };
    }));

    setCampaigns(enriched);
    setUsers(profilesData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const createCampaign = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('campaigns').insert({ name: newName, description: newDesc });
    if (error) { showNotif('❌ Kunne ikke oprette kampagne'); return; }
    showNotif('✅ Kampagne oprettet!');
    setNewName(''); setNewDesc(''); setShowCreate(false);
    fetchAll();
  };

  const archiveCampaign = async (id: string) => {
    await supabase.from('campaigns').update({ archived: true }).eq('id', id);
    showNotif('📦 Kampagne arkiveret');
    fetchAll();
  };

  const openCSV = (campaignId: string) => {
    setCsvCampaignId(campaignId);
    setShowCSV(true);
  };

  const handleCSVImport = async (leads: Array<{ company: string; phone: string; email: string; website: string }>) => {
    if (!csvCampaignId) return;
    const rows = leads.map(l => ({
      campaign_id: csvCampaignId,
      company: l.company,
      phone: l.phone,
      email: l.email,
      website: l.website,
    }));
    const { error } = await supabase.from('leads').insert(rows);
    if (error) { showNotif('❌ Fejl ved import'); return; }
    showNotif(`📥 ${leads.length} emner importeret!`);
    setShowCSV(false);
    fetchAll();
  };

  const assignUser = async (campaignId: string, userId: string) => {
    const { error } = await supabase.from('campaign_users').insert({ campaign_id: campaignId, user_id: userId });
    if (error) {
      if (error.code === '23505') showNotif('⚠️ Bruger er allerede tildelt');
      else showNotif('❌ Fejl ved tildeling');
      return;
    }
    showNotif('✅ Bruger tildelt kampagne');
    setAssignModal(null);
    fetchAll();
  };

  const removeUser = async (campaignId: string, userId: string) => {
    await supabase.from('campaign_users').delete().eq('campaign_id', campaignId).eq('user_id', userId);
    showNotif('🗑️ Bruger fjernet fra kampagne');
    fetchAll();
  };

  if (loading) return <div className="p-8 text-muted-foreground">Indlæser kampagner...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">📋 Kampagner ({campaigns.length})</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary-smooth text-sm">+ Ny kampagne</button>
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

      <div className="flex flex-col gap-4">
        {campaigns.length === 0 ? (
          <div className="card-surface rounded-2xl px-5 py-8 text-center text-muted-foreground text-sm">Ingen kampagner endnu</div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="card-surface rounded-2xl overflow-hidden">
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg">📋</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {c.name}
                    {c.archived && <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">Arkiveret</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.description || 'Ingen beskrivelse'}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="bg-secondary rounded-full px-2.5 py-1">{c.leadCount} emner</span>
                  <span className="bg-secondary rounded-full px-2.5 py-1">{c.assignedUsers?.length ?? 0} brugere</span>
                  <span>{new Date(c.created_at).toLocaleDateString('da-DK')}</span>
                </div>
                <span className="text-muted-foreground text-xs">{expandedCampaign === c.id ? '▲' : '▼'}</span>
              </div>

              {expandedCampaign === c.id && (
                <div className="px-5 pb-5 pt-2 border-t border-border/30 flex flex-col gap-4">
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openCSV(c.id)} className="btn-primary-smooth text-xs py-1.5 px-3">📂 Importer CSV</button>
                    <button onClick={() => setAssignModal(c.id)} className="btn-ghost-smooth text-xs py-1.5 px-3">👤 Tildel bruger</button>
                    {!c.archived && (
                      <button onClick={() => archiveCampaign(c.id)} className="btn-ghost-smooth text-xs py-1.5 px-3 hover:text-destructive">📦 Arkiver</button>
                    )}
                  </div>

                  {/* Assigned users */}
                  {(c.assignedUsers?.length ?? 0) > 0 && (
                    <div>
                      <div className="label-clean mb-2">Tildelte brugere</div>
                      <div className="flex flex-col gap-1.5">
                        {c.assignedUsers?.map(u => (
                          <div key={u.user_id} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{u.full_name || u.email}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                            <button onClick={() => removeUser(c.id, u.user_id)} className="text-xs text-muted-foreground hover:text-destructive cursor-pointer bg-transparent border-none">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assign user modal inline */}
                  {assignModal === c.id && (
                    <div className="bg-secondary/30 rounded-xl p-4">
                      <div className="label-clean mb-2">Vælg bruger at tildele</div>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                        {users.filter(u => !c.assignedUsers?.some(au => au.user_id === u.user_id)).map(u => (
                          <button
                            key={u.user_id}
                            onClick={() => assignUser(c.id, u.user_id)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer bg-transparent border-none text-left w-full transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{u.full_name || u.email}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </button>
                        ))}
                        {users.filter(u => !c.assignedUsers?.some(au => au.user_id === u.user_id)).length === 0 && (
                          <div className="text-xs text-muted-foreground py-2">Alle brugere er allerede tildelt</div>
                        )}
                      </div>
                      <button onClick={() => setAssignModal(null)} className="btn-ghost-smooth text-xs mt-3">Luk</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CSVUploadModal open={showCSV} onClose={() => setShowCSV(false)} onImport={handleCSVImport} />
    </div>
  );
};
