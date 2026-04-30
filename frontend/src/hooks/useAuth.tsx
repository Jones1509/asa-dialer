import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/backend-stub';
import type { User, Session } from '@/lib/backend-stub';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  profile: { full_name: string; email: string; approved: boolean; active: boolean } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isApproved: false,
  profile: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  const fetchUserData = useCallback(async (userId: string, email?: string) => {
    try {
      // Stub mode: derive admin/approved from email pattern.
      // Real backend: replace this with profiles + user_roles queries.
      const mail = (email || '').toLowerCase();
      const hasAdmin = mail.includes('admin') || mail.includes('kontor');
      setIsAdmin(hasAdmin);
      setIsApproved(true);
      setProfile({
        full_name: mail.split('@')[0] || 'Bruger',
        email: email || '',
        approved: true,
        active: true,
      });
      void userId;
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid deadlock from awaiting inside callback
          setTimeout(() => {
            if (mounted) {
              fetchUserData(newSession.user.id, newSession.user.email).then(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsApproved(false);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Then restore session from storage
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        fetchUserData(existingSession.user.id, existingSession.user.email).then(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsApproved(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isApproved, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
