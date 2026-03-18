import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, explicitDemoMode, isEnvMissing } from '../lib/supabase';
import type { UserRole } from '../types/database';

export type { UserRole };

const OAUTH_SIGNUP_META_KEY = 'oauth_signup_meta';

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
  const oauthMetaApplied = useRef(false);

  /**
   * After a Google OAuth redirect the DB trigger will have created a profile
   * with the default role ('paramedic') because signInWithOAuth does not
   * support user_metadata.  If the user chose a role/hospital on the signup
   * page we stashed it in localStorage before the redirect.  This helper
   * reads that stash, patches the profile row, and cleans up.
   */
  const applyOAuthSignupMeta = useCallback(async (userId: string) => {
    if (oauthMetaApplied.current) return;

    const raw = localStorage.getItem(OAUTH_SIGNUP_META_KEY);
    if (!raw) return;

    oauthMetaApplied.current = true;
    localStorage.removeItem(OAUTH_SIGNUP_META_KEY);

    try {
      const { role, hospitalId } = JSON.parse(raw) as {
        role: UserRole;
        hospitalId: string | null;
      };

      // Update the profile row with the chosen role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (updateError) {
        console.warn('OAuth profile role update failed:', updateError.message);
      }

      // Link hospital via RPC if applicable
      if (role === 'hospital_staff' && hospitalId) {
        try {
          await supabase.rpc('link_hospital', { p_hospital_id: hospitalId });
        } catch (rpcErr) {
          console.warn('OAuth hospital link failed (will retry on login):', rpcErr);
        }
      }
    } catch (parseErr) {
      console.warn('Failed to parse OAuth signup metadata:', parseErr);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, hospital_id, display_name')
        .eq('id', userId)
        .single();

      if (error) {
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
    supabase.auth.getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (error) {
          console.error('Failed to get session:', error.message);
          setLoading(false);
          return;
        }

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
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // On first sign-in via OAuth, apply any role/hospital the user
          // selected on the signup page before the redirect.
          if (event === 'SIGNED_IN') {
            await applyOAuthSignupMeta(newSession.user.id);
          }
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
  }, [fetchProfile, applyOAuthSignupMeta]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out failed:', error.message);
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
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
