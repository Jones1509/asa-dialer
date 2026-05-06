import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveUserData, isAdminRole } from '@/lib/auth-roles';
import type { User, Session } from '@supabase/supabase-js';

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

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const resolved = await resolveUserData(userId);

      if (!resolved.role) {
        // Ingen rolle fundet — sign out og lad LoginPage håndtere fejlen.
        console.error('[auth] No role found for user', userId, '- signing out');
        await supabase.auth.signOut();
        return;
      }

      setIsAdmin(isAdminRole(resolved.role));
      setIsApproved(resolved.aktiv);
      setProfile({
        full_name: resolved.navn,
        email: resolved.email,
        approved: resolved.aktiv,
        active: resolved.aktiv,
      });
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
              fetchUserData(newSession.user.id).then(() => {
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
        fetchUserData(existingSession.user.id).then(() => {
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
