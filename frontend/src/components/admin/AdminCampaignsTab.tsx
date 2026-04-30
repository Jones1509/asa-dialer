import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/backend-stub';
import { CSVUploadModal } from '@/components/dialer/CSVUploadModal';
import { LayoutGrid, Plus, FileUp, UserPlus, Archive, X, ChevronDown, ChevronUp, Users, Hash, Calendar } from 'lucide-react';

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
  // New: combined create flow
  const [createStep, setCreateStep] = useState<'info' | 'csv' | null>(null);
  const [newCampaignId, setNewCampaignId] = useState<string | null>(null);

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
    const { data, error } = await supabase.from('campaigns').insert({ name: newName, description: newDesc }).select().single();
    if (error || !data) { showNotif('Kunne ikke oprette kampagne'); return; }
    showNotif('Kampagne oprettet — tilføj nu leads via CSV');
    setNewCampaignId(data.id);
    setCsvCampaignId(data.id);
    setCreateStep('csv');
  };

  const archiveCampaign = async (id: string) => {
    await supabase.from('campaigns').update({ archived: true }).eq('id', id);
    showNotif('Kampagne arkiveret');
    fetchAll();
  };

  const openCSV = (campaignId: string) => {
    setCsvCampaignId(campaignId);
    setShowCSV(true);
  };

  const handleCSVImport = async (leads: Array<{ company: string; phone: string; email: string; website: string; contact_person: string }>) => {
    const targetId = csvCampaignId;
    if (!targetId) return;
    const rows = leads.map(l => ({
      campaign_id: targetId,
      company: l.company,
      phone: l.phone,
      email: l.email,
      website: l.website,
      contact_person: l.contact_person,
    }));
    const { error } = await supabase.from('leads').insert(rows);
    if (error) { showNotif('Fejl ved import'); return; }
    showNotif(`${leads.length} emner importeret`);
    setShowCSV(false);
    // If part of create flow, finish and reset
    if (createStep === 'csv') {
      setCreateStep(null);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setNewCampaignId(null);
    }
    fetchAll();
  };

  const assignUser = async (campaignId: string, userId: string) => {
    const { error } = await supabase.from('campaign_users').insert({ campaign_id: campaignId, user_id: userId });
    if (error) {
      if (error.code === '23505') showNotif('Bruger er allerede tildelt');
      else showNotif('Fejl ved tildeling');
      return;
    }
    showNotif('Bruger tildelt kampagne');
    setAssignModal(null);
    fetchAll();
  };

  const removeUser = async (campaignId: string, userId: string) => {
    await supabase.from('campaign_users').delete().eq('campaign_id', campaignId).eq('user_id', userId);
    showNotif('Bruger fjernet fra kampagne');
    fetchAll();
  };

  if (loading) return <div className="p-8 text-muted-foreground/60 text-[13px]">Indlæser kampagner...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-[14px]">Kampagner ({campaigns.length})</h3>
        <button onClick={() => { setShowCreate(!showCreate); setCreateStep('info'); }} className="btn-primary-smooth text-[12px] flex items-center gap-1.5">
          <Plus size={14} strokeWidth={2} />
          Ny kampagne
        </button>
      </div>

      {/* Combined create flow */}
      {showCreate && (
        <div className="card-surface rounded-xl overflow-hidden">
          {/* Step indicator */}
          <div className="px-5 py-3 border-b border-border/30 flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-[12px] font-medium ${createStep === 'info' ? 'text-primary' : 'text-muted-foreground/50'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${createStep === 'info' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>1</div>
              Opret
            </div>
            <div className="w-8 h-px bg-border/50" />
            <div className={`flex items-center gap-1.5 text-[12px] font-medium ${createStep === 'csv' ? 'text-primary' : 'text-muted-foreground/50'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${createStep === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>2</div>
              Importer leads
            </div>
          </div>

          <div className="p-5 flex flex-col gap-3.5">
            {createStep === 'info' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="label-clean">Kampagnenavn</label>
                  <input className="input-clean" value={newName} onChange={e => setNewName(e.target.value)} placeholder="F.eks. 'Elkunder marts 2026'" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label-clean">Beskrivelse</label>
                  <textarea className="input-clean resize-none h-16" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Valgfri beskrivelse" />
                </div>
                <div className="flex gap-2.5">
                  <button onClick={createCampaign} disabled={!newName.trim()} className={`btn-primary-smooth text-[12px] flex items-center gap-1.5 ${!newName.trim() ? 'opacity-40' : ''}`}>
                    Opret & importer CSV
                  </button>
                  <button onClick={() => { setShowCreate(false); setCreateStep(null); }} className="btn-ghost-smooth text-[12px]">Annuller</button>
                </div>
              </>
            )}

            {createStep === 'csv' && (
              <div className="text-center py-4">
                <div className="text-[13px] text-muted-foreground/60 mb-3">Kampagne "{newName}" oprettet — upload nu dine leads</div>
                <button onClick={() => setShowCSV(true)} className="btn-primary-smooth text-[12px] flex items-center gap-1.5 mx-auto">
                  <FileUp size={14} strokeWidth={2} /> Upload CSV-fil
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateStep(null); setNewName(''); setNewDesc(''); fetchAll(); }}
                  className="btn-ghost-smooth text-[11px] mt-3 mx-auto block"
                >
                  Spring over — gør det senere
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {campaigns.length === 0 ? (
          <div className="card-surface rounded-xl px-4 py-8 text-center text-muted-foreground/50 text-[13px]">Ingen kampagner endnu</div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="card-surface rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-secondary/20 transition-colors duration-150"
                onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
              >
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <LayoutGrid size={16} className="text-accent-foreground" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px] flex items-center gap-2">
                    {c.name}
                    {c.archived && <span className="text-[10px] text-muted-foreground/50 bg-secondary rounded-md px-1.5 py-0.5">Arkiveret</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground/50">{c.description || 'Ingen beskrivelse'}</div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
                  <span className="bg-secondary rounded-md px-2 py-0.5 tabular-nums flex items-center gap-1">
                    <Hash size={9} /> {c.leadCount} emner
                  </span>
                  <span className="bg-secondary rounded-md px-2 py-0.5 tabular-nums flex items-center gap-1">
                    <Users size={9} /> {c.assignedUsers?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={9} /> {new Date(c.created_at).toLocaleDateString('da-DK')}
                  </span>
                </div>
                {expandedCampaign === c.id ? <ChevronUp size={14} className="text-muted-foreground/40" /> : <ChevronDown size={14} className="text-muted-foreground/40" />}
              </div>

              {expandedCampaign === c.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border/20 flex flex-col gap-3.5">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openCSV(c.id)} className="btn-primary-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
                      <FileUp size={13} strokeWidth={2} /> Importer CSV
                    </button>
                    <button onClick={() => setAssignModal(c.id)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
                      <UserPlus size={13} strokeWidth={2} /> Tildel bruger
                    </button>
                    {!c.archived && (
                      <button onClick={() => archiveCampaign(c.id)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5 hover:text-destructive">
                        <Archive size={13} strokeWidth={2} /> Arkiver
                      </button>
                    )}
                  </div>

                  {(c.assignedUsers?.length ?? 0) > 0 && (
                    <div>
                      <div className="label-clean mb-2">Tildelte brugere</div>
                      <div className="flex flex-col gap-1">
                        {c.assignedUsers?.map(u => (
                          <div key={u.user_id} className="flex items-center gap-2.5 bg-secondary/30 rounded-lg px-3 py-2">
                            <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold tracking-wide">
                              {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium">{u.full_name || u.email}</div>
                              <div className="text-[11px] text-muted-foreground/50">{u.email}</div>
                            </div>
                            <button onClick={() => removeUser(c.id, u.user_id)} className="text-muted-foreground/40 hover:text-destructive cursor-pointer bg-transparent border-none transition-colors duration-150">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(c.assignedUsers?.length ?? 0) === 0 && (
                    <div className="bg-warning/5 border border-warning/15 rounded-lg px-3.5 py-2.5 text-[12px] text-warning flex items-center gap-2">
                      <Users size={13} strokeWidth={2} />
                      Ingen brugere tildelt — kampagnen er ikke synlig for medarbejdere endnu
                    </div>
                  )}

                  {assignModal === c.id && (
                    <div className="bg-secondary/20 rounded-lg p-3.5">
                      <div className="label-clean mb-2">Vælg bruger</div>
                      <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                        {users.filter(u => !c.assignedUsers?.some(au => au.user_id === u.user_id)).map(u => (
                          <button
                            key={u.user_id}
                            onClick={() => assignUser(c.id, u.user_id)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-accent/50 cursor-pointer bg-transparent border-none text-left w-full transition-colors duration-150"
                          >
                            <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                              <div className="text-[13px] font-medium">{u.full_name || u.email}</div>
                              <div className="text-[11px] text-muted-foreground/50">{u.email}</div>
                            </div>
                          </button>
                        ))}
                        {users.filter(u => !c.assignedUsers?.some(au => au.user_id === u.user_id)).length === 0 && (
                          <div className="text-[11px] text-muted-foreground/40 py-2">Alle brugere er tildelt</div>
                        )}
                      </div>
                      <button onClick={() => setAssignModal(null)} className="btn-ghost-smooth text-[11px] mt-2.5">Luk</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CSVUploadModal open={showCSV} onClose={() => { setShowCSV(false); if (createStep === 'csv') { setCreateStep(null); setShowCreate(false); setNewName(''); setNewDesc(''); fetchAll(); } }} onImport={handleCSVImport} />
    </div>
  );
};
