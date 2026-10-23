import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { tabel } from '@/lib/dialer-db';
import { CSVUploadModal } from '@/components/dialer/CSVUploadModal';
import { LayoutGrid, Plus, FileUp, UserPlus, Archive, X, ChevronDown, Users, Hash, Calendar } from 'lucide-react';
import { EmptyState, SkeletonRows } from '@/components/shell/states';

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
      supabase.from(tabel('campaigns')).select('*').order('created_at', { ascending: false }),
      supabase.from(tabel('profiles')).select('user_id, full_name, email').eq('approved', true),
    ]);

    const enriched = await Promise.all((campaignsData ?? []).map(async c => {
      const [{ count }, { data: cuData }] = await Promise.all([
        supabase.from(tabel('leads')).select('*', { count: 'exact', head: true }).eq('campaign_id', c.id),
        supabase.from(tabel('campaign_users')).select('user_id').eq('campaign_id', c.id),
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
    const { data, error } = await supabase.from(tabel('campaigns')).insert({ name: newName, description: newDesc }).select().single();
    if (error || !data) { showNotif('Kunne ikke oprette kampagne'); return; }
    showNotif('Kampagne oprettet — tilføj nu leads via CSV');
    setNewCampaignId(data.id);
    setCsvCampaignId(data.id);
    setCreateStep('csv');
  };

  const archiveCampaign = async (id: string) => {
    await supabase.from(tabel('campaigns')).update({ archived: true }).eq('id', id);
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
    const { error } = await supabase.from(tabel('leads')).insert(rows);
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
    const { error } = await supabase.from(tabel('campaign_users')).insert({ campaign_id: campaignId, user_id: userId });
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
    await supabase.from(tabel('campaign_users')).delete().eq('campaign_id', campaignId).eq('user_id', userId);
    showNotif('Bruger fjernet fra kampagne');
    fetchAll();
  };

  if (loading) return <div className="card-surface overflow-hidden"><SkeletonRows rows={4} /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Kampagner <span className="font-body text-sm font-normal text-muted-foreground">({campaigns.length})</span></h2>
        <button type="button" onClick={() => { setShowCreate(!showCreate); setCreateStep('info'); }} className="btn-primary">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Ny kampagne
        </button>
      </div>

      {/* Combined create flow */}
      {showCreate && (
        <div className="card-surface overflow-hidden">
          {/* Step indicator */}
          <div className="flex items-center gap-4 border-b border-border px-5 py-3">
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
                  <label htmlFor="cf-name" className="label-clean">Kampagnenavn</label>
                  <input id="cf-name" className="input-clean" value={newName} onChange={e => setNewName(e.target.value)} placeholder="F.eks. 'Elkunder marts 2026'" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cf-desc" className="label-clean">Beskrivelse</label>
                  <textarea id="cf-desc" className="input-clean resize-none h-20" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Valgfri beskrivelse" />
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button type="button" onClick={createCampaign} disabled={!newName.trim()} className="btn-primary">
                    Opret & importer CSV
                  </button>
                  <button type="button" onClick={() => { setShowCreate(false); setCreateStep(null); }} className="btn-ghost">Annuller</button>
                </div>
              </>
            )}

            {createStep === 'csv' && (
              <div className="text-center py-4">
                <div className="mb-3 text-sm text-muted-foreground">Kampagne "{newName}" oprettet — upload nu dine leads</div>
                <button type="button" onClick={() => setShowCSV(true)} className="btn-primary mx-auto">
                  <FileUp size={16} strokeWidth={2} aria-hidden="true" /> Upload CSV-fil
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateStep(null); setNewName(''); setNewDesc(''); fetchAll(); }}
                  className="btn-ghost mx-auto mt-3 flex"
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
          <div className="card-surface"><EmptyState icon={LayoutGrid} title="Ingen kampagner endnu" message="Opret en kampagne, importér emner fra en CSV-fil og tildel sælgere." action={{ label: 'Ny kampagne', icon: Plus, onClick: () => { setShowCreate(true); setCreateStep('info'); } }} /></div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="card-surface overflow-hidden">
              <button
                type="button"
                aria-expanded={expandedCampaign === c.id}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-secondary/50"
                onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <LayoutGrid size={16} className="text-primary" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {c.name}
                    {c.archived && <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">Arkiveret</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.description || 'Ingen beskrivelse'}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 tabular-nums">
                    <Hash size={16} aria-hidden="true" className="h-3.5 w-3.5" /> {c.leadCount} emner
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 tabular-nums" title="Tildelte brugere">
                    <Users size={16} aria-hidden="true" className="h-3.5 w-3.5" /> {c.assignedUsers?.length ?? 0}
                  </span>
                  <span className="hidden items-center gap-1 sm:flex">
                    <Calendar size={16} aria-hidden="true" className="h-3.5 w-3.5" /> {new Date(c.created_at).toLocaleDateString('da-DK')}
                  </span>
                </div>
                <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-muted-foreground transition-transform duration-150 ${expandedCampaign === c.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedCampaign === c.id && (
                <div className="flex flex-col gap-4 border-t border-border px-4 pb-4 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openCSV(c.id)} className="btn-primary btn-sm">
                      <FileUp size={16} strokeWidth={2} aria-hidden="true" /> Importer CSV
                    </button>
                    <button type="button" onClick={() => setAssignModal(c.id)} className="btn-secondary btn-sm">
                      <UserPlus size={16} strokeWidth={2} aria-hidden="true" /> Tildel bruger
                    </button>
                    {!c.archived && (
                      <button type="button" onClick={() => archiveCampaign(c.id)} className="btn-ghost btn-sm hover:!text-destructive">
                        <Archive size={16} strokeWidth={2} aria-hidden="true" /> Arkiver
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
                              <div className="text-sm font-medium">{u.full_name || u.email}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                            <button type="button" onClick={() => removeUser(c.id, u.user_id)} aria-label={`Fjern ${u.full_name || u.email} fra kampagnen`} className="icon-btn hover:!bg-destructive/10 hover:!text-destructive">
                              <X size={16} aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(c.assignedUsers?.length ?? 0) === 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-foreground">
                      <Users size={16} strokeWidth={2} className="shrink-0 text-warning" aria-hidden="true" />
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
                            type="button"
                            className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors duration-150 hover:bg-accent/60"
                          >
                            <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{u.full_name || u.email}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </button>
                        ))}
                        {users.filter(u => !c.assignedUsers?.some(au => au.user_id === u.user_id)).length === 0 && (
                          <div className="py-2 text-sm text-muted-foreground">Alle godkendte brugere er allerede tildelt</div>
                        )}
                      </div>
                      <button type="button" onClick={() => setAssignModal(null)} className="btn-ghost btn-sm mt-2">Luk</button>
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
