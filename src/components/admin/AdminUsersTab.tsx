import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle2, Lock, Unlock, UserCheck, Pencil, X, Shield, Users } from 'lucide-react';

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  approved: boolean;
  active: boolean;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: string;
}

interface AdminUsersTabProps {
  showNotif: (msg: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ showNotif }) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email, approved, active, created_at').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    setUsers(profilesRes.data ?? []);
    setRoles(rolesRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const isAdmin = (userId: string) => roles.some(r => r.user_id === userId && r.role === 'admin');

  const toggleApproval = async (userId: string, approved: boolean) => {
    await supabase.from('profiles').update({ approved: !approved }).eq('user_id', userId);
    showNotif(approved ? 'Bruger deaktiveret' : 'Bruger godkendt');
    fetchData();
  };

  const toggleActive = async (userId: string, active: boolean) => {
    await supabase.from('profiles').update({ active: !active }).eq('user_id', userId);
    showNotif(active ? 'Bruger deaktiveret' : 'Bruger aktiveret');
    fetchData();
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditName(user.full_name);
    setEditEmail(user.email);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: editName, email: editEmail }).eq('user_id', editUser.user_id);
    showNotif('Bruger opdateret');
    setSaving(false);
    setEditUser(null);
    fetchData();
  };

  if (loading) return <div className="p-8 text-muted-foreground/60 text-[13px]">Indlæser brugere...</div>;

  const pendingUsers = users.filter(u => !u.approved);
  const adminUsers = users.filter(u => u.approved && isAdmin(u.user_id));
  const regularUsers = users.filter(u => u.approved && !isAdmin(u.user_id));

  const UserCard = ({ user }: { user: UserRow }) => (
    <div key={user.user_id} className="flex items-center gap-3.5 px-4 py-3.5 border-b border-border/20 last:border-0">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        isAdmin(user.user_id) ? 'bg-primary/10' : user.active ? 'bg-success/10' : 'bg-destructive/10'
      }`}>
        {isAdmin(user.user_id)
          ? <Shield size={16} className="text-primary" strokeWidth={1.8} />
          : user.active
            ? <CheckCircle2 size={16} className="text-success" strokeWidth={1.8} />
            : <Lock size={16} className="text-destructive/70" strokeWidth={1.8} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13px]">{user.full_name || 'Ingen navn'}</div>
        <div className="text-[11px] text-muted-foreground/50">{user.email}</div>
      </div>
      <div className="text-[11px] text-muted-foreground/40">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${user.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive/70'}`}>
        {user.active ? 'Aktiv' : 'Inaktiv'}
      </span>
      <button onClick={() => openEdit(user)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
        <Pencil size={12} /> Rediger
      </button>
      <button onClick={() => toggleActive(user.user_id, user.active)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
        {user.active ? <><Lock size={12} /> Deaktiver</> : <><Unlock size={12} /> Aktiver</>}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-border/30">
            <button onClick={() => setEditUser(null)} className="absolute top-4 right-4 text-muted-foreground/50 hover:text-foreground transition-colors">
              <X size={18} />
            </button>
            <h3 className="font-heading font-bold text-[16px] mb-5">Rediger bruger</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground/70 mb-1.5">Fulde navn</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border/30 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground/70 mb-1.5">Email</label>
                <input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border/30 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setEditUser(null)} className="btn-ghost-smooth text-[12px] py-2 px-4 flex-1">Annuller</button>
                <button onClick={saveEdit} disabled={saving} className="btn-primary-smooth text-[12px] py-2 px-4 flex-1">
                  {saving ? 'Gemmer...' : 'Gem ændringer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending */}
      {pendingUsers.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-[14px] mb-3 flex items-center gap-2">
            <Clock size={15} className="text-warning" strokeWidth={2} />
            Afventer godkendelse
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-md px-2 py-0.5">{pendingUsers.length}</span>
          </h3>
          <div className="card-surface rounded-xl overflow-hidden">
            {pendingUsers.map(user => (
              <div key={user.user_id} className="flex items-center gap-3.5 px-4 py-3.5 border-b border-border/20 last:border-0">
                <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center">
                  <Clock size={16} className="text-warning" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px]">{user.full_name || 'Ingen navn'}</div>
                  <div className="text-[11px] text-muted-foreground/50">{user.email}</div>
                </div>
                <div className="text-[11px] text-muted-foreground/40">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
                <button onClick={() => openEdit(user)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
                  <Pencil size={12} /> Rediger
                </button>
                <button onClick={() => toggleApproval(user.user_id, false)} className="btn-primary-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
                  <UserCheck size={13} strokeWidth={2} /> Godkend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admins */}
      <div>
        <h3 className="font-heading font-bold text-[14px] mb-3 flex items-center gap-2">
          <Shield size={15} className="text-primary" strokeWidth={2} />
          Administratorer ({adminUsers.length})
        </h3>
        <div className="card-surface rounded-xl overflow-hidden">
          {adminUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground/50 text-[13px]">Ingen administratorer</div>
          ) : (
            adminUsers.map(user => <UserCard key={user.user_id} user={user} />)
          )}
        </div>
      </div>

      {/* Regular users */}
      <div>
        <h3 className="font-heading font-bold text-[14px] mb-3 flex items-center gap-2">
          <Users size={15} className="text-muted-foreground/70" strokeWidth={2} />
          Brugere ({regularUsers.length})
        </h3>
        <div className="card-surface rounded-xl overflow-hidden">
          {regularUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground/50 text-[13px]">Ingen brugere endnu</div>
          ) : (
            regularUsers.map(user => <UserCard key={user.user_id} user={user} />)
          )}
        </div>
      </div>
    </div>
  );
};
