import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, CheckCircle2, UserX, UserCheck, Lock, Unlock } from 'lucide-react';

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
    showNotif(approved ? 'Bruger deaktiveret' : 'Bruger godkendt');
    fetchUsers();
  };

  const toggleActive = async (userId: string, active: boolean) => {
    await supabase.from('profiles').update({ active: !active }).eq('user_id', userId);
    showNotif(active ? 'Bruger deaktiveret' : 'Bruger aktiveret');
    fetchUsers();
  };

  if (loading) return <div className="p-8 text-muted-foreground/60 text-[13px]">Indlæser brugere...</div>;

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="flex flex-col gap-6">
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
                <button onClick={() => toggleApproval(user.user_id, false)} className="btn-primary-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
                  <UserCheck size={13} strokeWidth={2} />
                  Godkend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-heading font-bold text-[14px] mb-3">Alle brugere ({approvedUsers.length})</h3>
        <div className="card-surface rounded-xl overflow-hidden">
          {approvedUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground/50 text-[13px]">Ingen godkendte brugere endnu</div>
          ) : (
            approvedUsers.map(user => (
              <div key={user.user_id} className="flex items-center gap-3.5 px-4 py-3.5 border-b border-border/20 last:border-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${user.active ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {user.active
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
                <button onClick={() => toggleActive(user.user_id, user.active)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
                  {user.active ? <><Lock size={12} /> Deaktiver</> : <><Unlock size={12} /> Aktiver</>}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
