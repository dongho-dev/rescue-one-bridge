import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, explicitDemoMode, isEnvMissing } from '../lib/supabase';

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
  isDemoMode: boolean;
  isEnvMissing: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  isDemoMode: false,
  isEnvMissing: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
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
    // If env vars are missing (and no explicit demo mode), stop loading immediately
    if (isEnvMissing) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // If explicit demo mode is on, set up demo user
    if (explicitDemoMode) {
      setUser({ id: 'demo-user' } as User);
      setProfile({
        role: 'hospital_staff',
        hospital_id: 'demo-hospital',
        display_name: 'Demo User',
      });
      setLoading(false);
      return;
    }

    // Normal Supabase auth flow
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, isDemoMode: explicitDemoMode, isEnvMissing }}>
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
