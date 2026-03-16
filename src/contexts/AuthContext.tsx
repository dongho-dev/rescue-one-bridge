import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'hospital_staff' | 'paramedic';

export interface UserProfile {
  role: UserRole;
  hospital_id: string | null;
  display_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, hospital_id, display_name')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet (new user via OAuth)
        console.warn('Profile fetch failed:', error.message);
        setProfile(null);
        return;
      }

      setProfile({
        role: data.role as UserRole,
        hospital_id: data.hospital_id,
        display_name: data.display_name,
      });
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setProfile({ role: 'hospital_staff', hospital_id: null, display_name: 'Demo User' });
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Register listener first to prevent event loss
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Handle pending OAuth role assignment
          const pendingRole = localStorage.getItem('pending_signup_role');
          const pendingHospitalId = localStorage.getItem('pending_signup_hospital_id');

          if (pendingRole) {
            await supabase.from('profiles').update({
              role: pendingRole,
              hospital_id: pendingHospitalId || null,
            }).eq('id', newSession.user.id);

            localStorage.removeItem('pending_signup_role');
            localStorage.removeItem('pending_signup_hospital_id');
          }
        }

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // 2. Then get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
      if (!isMounted) return;
      if (sessionError) {
        console.error('Failed to get session:', sessionError.message);
        setLoading(false);
        return;
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      if (isMounted) {
        console.error('Unexpected error getting session:', err);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      // Demo mode: manual cleanup
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error.message);
      // Even on failure, clear local state for UX
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    // On success, onAuthStateChange SIGNED_OUT event handles state cleanup
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
