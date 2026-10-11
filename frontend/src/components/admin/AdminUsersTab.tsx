import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Clock, CheckCircle2, UserCheck, Lock, Unlock, Users } from 'lucide-react';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/shell/states';

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
  const [failed, setFailed] = useState(false);

  const fetchUsers = async () => {
    setFailed(false);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, approved, active, created_at')
      .order('created_at', { ascending: false });
    if (error) setFailed(true);
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleApproval = async (userId: string, approved: boolean) => {
    const { error } = await supabase.from('profiles').update({ approved: !approved }).eq('user_id', userId);
    showNotif(error ? 'Handlingen mislykkedes — prøv igen' : approved ? 'Bruger deaktiveret' : 'Bruger godkendt');
    fetchUsers();
  };

  const toggleActive = async (userId: string, active: boolean) => {
    const { error } = await supabase.from('profiles').update({ active: !active }).eq('user_id', userId);
    showNotif(error ? 'Handlingen mislykkedes — prøv igen' : active ? 'Bruger deaktiveret' : 'Bruger aktiveret');
    fetchUsers();
  };

  if (loading) return <div className="card-surface overflow-hidden"><SkeletonRows rows={5} /></div>;
  if (failed) return <div className="card-surface"><ErrorState title="Kunne ikke hente brugere" onRetry={() => { setLoading(true); fetchUsers(); }} /></div>;

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="flex flex-col gap-8">
      {pendingUsers.length > 0 && (
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Clock size={20} className="text-warning" strokeWidth={1.75} aria-hidden="true" />
            Afventer godkendelse
            <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">{pendingUsers.length}</span>
          </h2>
          <ul className="card-surface divide-y divide-border overflow-hidden">
            {pendingUsers.map(user => (
              <li key={user.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/15">
                  <Clock size={16} className="text-warning" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="text-sm font-medium">{user.full_name || 'Ingen navn'}</div>
                  <div className="break-all text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="hidden text-xs text-muted-foreground sm:block">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
                <button type="button" onClick={() => toggleApproval(user.user_id, false)} className="btn-primary btn-sm">
                  <UserCheck size={16} strokeWidth={2} aria-hidden="true" />
                  Godkend
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">Alle brugere <span className="font-body text-sm font-normal text-muted-foreground">({approvedUsers.length})</span></h2>
        <div className="card-surface overflow-hidden">
          {approvedUsers.length === 0 ? (
            <EmptyState icon={Users} title="Ingen godkendte brugere endnu" message="Nye brugere dukker op under “Afventer godkendelse”, når de har oprettet sig." />
          ) : (
            <ul className="divide-y divide-border">
              {approvedUsers.map(user => (
                <li key={user.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${user.active ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {user.active
                      ? <CheckCircle2 size={16} className="text-success" strokeWidth={1.75} aria-hidden="true" />
                      : <Lock size={16} className="text-destructive" strokeWidth={1.75} aria-hidden="true" />
                    }
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <div className="text-sm font-medium">{user.full_name || 'Ingen navn'}</div>
                    <div className="break-all text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${user.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {user.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <button type="button" onClick={() => toggleActive(user.user_id, user.active)} className="btn-secondary btn-sm">
                    {user.active ? <><Lock size={16} aria-hidden="true" /> Deaktiver</> : <><Unlock size={16} aria-hidden="true" /> Aktiver</>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
