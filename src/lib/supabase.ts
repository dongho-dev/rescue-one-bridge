import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const isDemoModeEnv = import.meta.env.VITE_DEMO_MODE === 'true';
const isProduction = import.meta.env.PROD === true;

/** True when env vars are missing and demo mode is NOT explicitly enabled */
export const isEnvMissing = (!supabaseUrl || !supabaseAnonKey) && !isDemoModeEnv;

/** True only when VITE_DEMO_MODE=true is explicitly set and Supabase is not configured.
 *  Blocked in production builds for safety. */
export const explicitDemoMode = isDemoModeEnv && (!supabaseUrl || !supabaseAnonKey) && !isProduction;

let _supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else if (isProduction && !isDemoModeEnv) {
  console.error(
    '[rescue-one-bridge] 프로덕션 환경에서 Supabase 환경변수가 누락되었습니다. ' +
    'VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.'
  );
}

export const supabase = _supabase as SupabaseClient;
