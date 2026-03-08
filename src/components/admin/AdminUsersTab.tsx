import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  approved: boolean;
  active: boolean;
  created_at: string;
}

interface AdminUsersTabProps {
  showNotif: (msg: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ showNotif }) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, approved, active, created_at')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleApproval = async (userId: string, approved: boolean) => {
    await supabase.from('profiles').update({ approved: !approved }).eq('user_id', userId);
    showNotif(approved ? '❌ Bruger deaktiveret' : '✅ Bruger godkendt');
    fetchUsers();
  };

  const toggleActive = async (userId: string, active: boolean) => {
    await supabase.from('profiles').update({ active: !active }).eq('user_id', userId);
    showNotif(active ? '🔒 Bruger deaktiveret' : '🔓 Bruger aktiveret');
    fetchUsers();
  };

  if (loading) return <div className="p-8 text-muted-foreground">Indlæser brugere...</div>;

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="flex flex-col gap-6">
      {pendingUsers.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
            ⏳ Afventer godkendelse
            <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-2 py-0.5">{pendingUsers.length}</span>
          </h3>
          <div className="card-surface rounded-2xl overflow-hidden">
            {pendingUsers.map(user => (
              <div key={user.user_id} className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center text-lg">⏳</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{user.full_name || 'Ingen navn'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
                <button onClick={() => toggleApproval(user.user_id, false)} className="btn-primary-smooth text-xs py-1.5 px-4">
                  ✅ Godkend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-heading font-bold text-base mb-3">👥 Alle brugere ({approvedUsers.length})</h3>
        <div className="card-surface rounded-2xl overflow-hidden">
          {approvedUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">Ingen godkendte brugere endnu</div>
          ) : (
            approvedUsers.map(user => (
              <div key={user.user_id} className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${user.active ? 'bg-success/20' : 'bg-destructive/20'}`}>
                  {user.active ? '✅' : '🔒'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{user.full_name || 'Ingen navn'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {user.active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button onClick={() => toggleActive(user.user_id, user.active)} className="btn-ghost-smooth text-xs py-1.5 px-3">
                  {user.active ? '🔒 Deaktiver' : '🔓 Aktiver'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
