import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";
import { AppContent } from "../layout/AppContent";
import { DemoRoleSwitcher } from "./DemoRoleSwitcher";

type AuthPage = 'login' | 'signup';

export function AuthGate() {
  const { user, loading, isDemoMode, isEnvMissing: envMissing } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center gap-4">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
          <Building2 size={32} className="text-white" />
        </div>
        <Loader2 size={28} className="animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">인증 확인 중...</p>
      </div>
    );
  }

  if (envMissing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center gap-4 p-4">
        <div className="p-3 bg-red-600 rounded-2xl shadow-lg">
          <Building2 size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-red-700 dark:text-red-400">환경변수 설정 오류</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
          환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.<br />
          <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded mt-1 inline-block">
            VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
          </code>
        </p>
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-1.5 text-sm font-medium shadow-md flex items-center justify-center gap-3">
          <span>데모 모드 · 실제 데이터는 저장되지 않습니다</span>
          <DemoRoleSwitcher />
        </div>
        <div className="pt-9">
          <AppContent />
        </div>
      </>
    );
  }

  if (!user) {
    if (authPage === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthPage('signup')} />;
  }

  return <AppContent />;
}
