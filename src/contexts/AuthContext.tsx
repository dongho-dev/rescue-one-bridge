import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, explicitDemoMode, isEnvMissing } from '../lib/supabase';
import type { UserRole } from '../types/database';
import { toast } from 'sonner';
import { clearQueue } from '../utils/offlineQueue';

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
  switchDemoRole?: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  isDemoMode: false,
  isEnvMissing: false,
  switchDemoRole: undefined,
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
   * reads that stash and links the hospital via server-side RPC.
   *
   * NOTE: Role update is handled server-side only (via apply_oauth_role RPC)
   * to prevent client-side privilege escalation.
   */
  const applyOAuthSignupMeta = useCallback(async (_userId: string) => {
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

      // Apply role via server-side RPC (validates role server-side)
      const { error: roleError } = await supabase.rpc('apply_oauth_role', {
        p_role: role,
      });
      if (roleError && import.meta.env.DEV) {
        console.warn('OAuth role apply failed:', roleError.message);
      }

      // Link hospital via RPC if applicable
      if (role === 'hospital_staff' && hospitalId) {
        const { error: linkError } = await supabase.rpc('link_hospital', {
          p_hospital_id: hospitalId,
        });
        if (linkError && import.meta.env.DEV) {
          console.warn('OAuth hospital link failed:', linkError.message);
        }
      }
    } catch {
      // Silently fail — user can retry role setup from profile
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
        if (import.meta.env.DEV) console.warn('Profile fetch failed:', error.message);
        setProfile(null);
        return;
      }

      const validRoles: UserRole[] = ['hospital_staff', 'paramedic'];
      const role: UserRole = validRoles.includes(data.role as UserRole)
        ? (data.role as UserRole)
        : 'paramedic';

      setProfile({
        role,
        hospital_id: data.hospital_id,
        display_name: data.display_name,
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Unexpected error fetching profile:', err);
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
      return () => {};
    }

    // Use only onAuthStateChange to avoid race condition between
    // getSession() and onAuthStateChange (Supabase recommended pattern).
    // The INITIAL_SESSION event fires once on setup with the current session,
    // eliminating the need for a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
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
        } catch (err) {
          if (import.meta.env.DEV) console.error('Error handling auth state change:', err);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, applyOAuthSignupMeta]);

  const signOut = useCallback(async () => {
    // Always force local cleanup regardless of server-side result
    setUser(null);
    setSession(null);
    setProfile(null);

    // Clear sensitive client-side data
    clearQueue();
    localStorage.removeItem(OAUTH_SIGNUP_META_KEY);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (import.meta.env.DEV) console.error('Sign out failed:', error.message);
        toast.error('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Unexpected error during sign out:', err);
      toast.error('로그아웃 중 예기치 않은 오류가 발생했습니다.');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, signOut,
      isDemoMode: explicitDemoMode,
      isEnvMissing,
      switchDemoRole: explicitDemoMode ? () => {
        setProfile(prev => prev ? {
          ...prev,
          role: prev.role === 'hospital_staff' ? 'paramedic' : 'hospital_staff',
          hospital_id: prev.role === 'hospital_staff' ? null : 'demo-hospital',
        } : prev);
      } : undefined,
    }}>
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
