import { useState, Suspense, lazy, useMemo } from 'react';
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ThemeProvider, useTheme } from "./components/theme/ThemeProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RequestsProvider } from "./contexts/RequestsContext";
import type { UserRole } from "./types/database";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { toast } from "sonner";
import {
  Building2,
  Sun,
  Moon,
  Monitor,
  Home,
  Users,
  Bed,
  UserCheck,
  Stethoscope,
  Ambulance,
  Menu,
  X,
  LogOut,
  Loader2,
  User,
  Bell,
  Settings,
  Save,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { useNotification } from "./hooks/useNotification";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useSessionTimeout } from "./hooks/useSessionTimeout";

const HospitalDashboard = lazy(() => import('./components/hospital/HospitalDashboard').then(m => ({ default: m.HospitalDashboard })));
const PatientDetails = lazy(() => import('./components/hospital/PatientDetails').then(m => ({ default: m.PatientDetails })));
const BedManagement = lazy(() => import('./components/hospital/BedManagement').then(m => ({ default: m.BedManagement })));
const StaffManagement = lazy(() => import('./components/hospital/StaffManagement').then(m => ({ default: m.StaffManagement })));
const EquipmentStatus = lazy(() => import('./components/hospital/EquipmentStatus').then(m => ({ default: m.EquipmentStatus })));
const PatientRequest = lazy(() => import('./components/paramedic/PatientRequest').then(m => ({ default: m.PatientRequest })));
const ParamedicDashboard = lazy(() => import('./components/paramedic/ParamedicDashboard').then(m => ({ default: m.ParamedicDashboard })));
const HospitalAdmin = lazy(() => import('./components/admin/HospitalAdmin').then(m => ({ default: m.HospitalAdmin })));

type CurrentPage = 'dashboard' | 'patients' | 'beds' | 'staff' | 'equipment' | 'request' | 'paramedic-dashboard' | 'admin';

type AuthPage = 'login' | 'signup';

interface NavigationItem {
  id: CurrentPage;
  label: string;
  icon: typeof Home;
  roles: UserRole[];
}

const allNavigationItems: NavigationItem[] = [
  { id: 'dashboard', label: '대시보드', icon: Home, roles: ['hospital_staff'] },
  { id: 'patients', label: '환자 관리', icon: Users, roles: ['hospital_staff'] },
  { id: 'beds', label: '병상 관리', icon: Bed, roles: ['hospital_staff'] },
  { id: 'staff', label: '직원 관리', icon: UserCheck, roles: ['hospital_staff'] },
  { id: 'equipment', label: '장비 현황', icon: Stethoscope, roles: ['hospital_staff'] },
  { id: 'request', label: '구급대원 요청', icon: Ambulance, roles: ['hospital_staff', 'paramedic'] },
  { id: 'paramedic-dashboard', label: '대시보드', icon: Home, roles: ['paramedic'] },
  { id: 'admin', label: '병원 관리', icon: Settings, roles: ['hospital_staff'] },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="테마 변경">
          {theme === 'light' && <Sun size={16} />}
          {theme === 'dark' && <Moon size={16} />}
          {theme === 'system' && <Monitor size={16} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun size={16} className="mr-2" />
          밝게
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon size={16} className="mr-2" />
          어둡게
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor size={16} className="mr-2" />
          시스템
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DemoRoleSwitcher() {
  const { profile, switchDemoRole } = useAuth();
  if (!switchDemoRole) return null;
  const label = profile?.role === 'paramedic' ? '구급대원' : '병원 직원';
  return (
    <button
      onClick={switchDemoRole}
      className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
    >
      현재: {label} (전환)
    </button>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rescue-one-theme">
      <AuthProvider>
        <RequestsProvider>
          <AuthGate />
        </RequestsProvider>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}

function AuthGate() {
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

function AppContent() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { permission, requestPermission } = useNotification();
  useSessionTimeout();

  const [profileOpen, setProfileOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const handleOpenProfile = () => {
    setEditDisplayName(profile?.display_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    setProfileSaving(true);
    const success = await updateProfile({
      display_name: editDisplayName.trim(),
      phone: editPhone.trim() || undefined,
    });
    setProfileSaving(false);
    if (success) {
      toast.success('프로필이 업데이트되었습니다.');
      setProfileOpen(false);
    }
  };

  const NOTIFICATION_DISMISS_KEY = 'r1b_notification_dismissed_at';
  const NOTIFICATION_RE_ASK_DAYS = 7;

  const [notificationDismissed, setNotificationDismissed] = useState(() => {
    try {
      const dismissedAt = localStorage.getItem(NOTIFICATION_DISMISS_KEY);
      if (!dismissedAt) return false;
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      return daysSince < NOTIFICATION_RE_ASK_DAYS;
    } catch {
      return false;
    }
  });

  const handleDismissNotification = () => {
    try {
      localStorage.setItem(NOTIFICATION_DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable (private browsing)
    }
    setNotificationDismissed(true);
  };
  const [currentPage, setCurrentPage] = useState<CurrentPage>(() => {
    // Default page based on role
    if (profile?.role === 'paramedic') return 'paramedic-dashboard';
    return 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const online = useOnlineStatus();
  const showNotificationModal = permission === 'default' && !notificationDismissed;

  const navigationItems = useMemo(() => {
    if (!profile?.role) {
      // 데모 모드: paramedic 전용 대시보드는 제외 (hospital 대시보드와 중복 방지)
      return allNavigationItems.filter(item => item.id !== 'paramedic-dashboard');
    }
    return allNavigationItems.filter(item =>
      item.roles.includes(profile.role)
    );
  }, [profile?.role]);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '사용자';
  const roleLabel = profile?.role === 'paramedic' ? '구급대원' : '병원 직원';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 hidden md:flex flex-col shrink-0`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="p-2 bg-sidebar-primary/20 rounded-lg shrink-0">
            <Building2 size={24} className="text-sidebar-primary" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm whitespace-nowrap">Rescue One Bridge</h1>
              <p className="text-xs text-sidebar-accent-foreground/70 whitespace-nowrap">응급실 관리 시스템</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as CurrentPage)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout (Desktop) */}
        <div className="border-t border-sidebar-border p-3">
          <AlertDialog>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenProfile}
                className="flex items-center gap-3 flex-1 min-w-0 rounded-lg p-1 -m-1 hover:bg-sidebar-accent transition-colors cursor-pointer"
                aria-label="프로필 수정"
              >
                <div className="p-2 bg-sidebar-accent rounded-lg shrink-0">
                  <User size={16} className="text-sidebar-foreground/70" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel}</p>
                </div>
              </button>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-sidebar-foreground/70 hover:text-red-500"
                  aria-label="로그아웃"
                >
                  <LogOut size={16} />
                </Button>
              </AlertDialogTrigger>
            </div>
          ) : (
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sidebar-foreground/70 hover:text-red-500"
                aria-label="로그아웃"
              >
                <LogOut size={16} />
              </Button>
            </AlertDialogTrigger>
          )}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>로그아웃 확인</AlertDialogTitle>
              <AlertDialogDescription>
                정말 로그아웃하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>로그아웃</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sidebar-primary/20 rounded-lg shrink-0">
                  <Building2 size={24} className="text-sidebar-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-sm">Rescue One Bridge</h1>
                  <p className="text-xs text-sidebar-accent-foreground/70">응급실 관리 시스템</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground" aria-label="메뉴 닫기">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id as CurrentPage);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Info & Logout (Mobile) */}
            <div className="border-t border-sidebar-border p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenProfile}
                  className="flex items-center gap-3 flex-1 min-w-0 rounded-lg p-1 -m-1 hover:bg-sidebar-accent transition-colors cursor-pointer"
                  aria-label="프로필 수정"
                >
                  <div className="p-2 bg-sidebar-accent rounded-lg shrink-0">
                    <User size={16} className="text-sidebar-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel}</p>
                  </div>
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-sidebar-foreground/70 hover:text-red-500"
                      aria-label="로그아웃"
                    >
                      <LogOut size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>로그아웃 확인</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말 로그아웃하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOut}>로그아웃</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)} className="md:hidden">
              <Menu size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex">
              <Menu size={18} />
            </Button>
            <h2 className="font-semibold text-lg">
              {navigationItems.find(i => i.id === currentPage)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`hidden sm:flex ${online
              ? 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950'
              : 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950'
            }`}>
              {online ? '● 연결됨' : '● 오프라인'}
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        {/* 알림 권한 모달 */}
        <Dialog open={showNotificationModal} onOpenChange={(open) => { if (!open) handleDismissNotification(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>알림을 켜주세요</DialogTitle>
              <DialogDescription>
                새로운 응급 요청이 도착하면 즉시 알림을 받을 수 있습니다.
                알림을 켜면 환자 이송 요청을 놓치지 않습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-2">
              <Button onClick={async () => {
                const granted = await requestPermission();
                if (granted) {
                  handleDismissNotification();
                  toast.success('알림이 활성화되었습니다');
                } else {
                  toast.error('알림이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
                  handleDismissNotification();
                }
              }}>
                <Bell size={16} className="mr-2" />
                알림 켜기
              </Button>
              <Button variant="ghost" onClick={handleDismissNotification}>
                나중에
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">로딩 중...</p></div>}>
              {currentPage === 'dashboard' && <HospitalDashboard />}
              {currentPage === 'patients' && <PatientDetails />}
              {currentPage === 'beds' && <BedManagement />}
              {currentPage === 'staff' && <StaffManagement />}
              {currentPage === 'equipment' && <EquipmentStatus />}
              {currentPage === 'request' && <PatientRequest />}
              {currentPage === 'paramedic-dashboard' && <ParamedicDashboard />}
              {currentPage === 'admin' && <HospitalAdmin />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* 프로필 수정 Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>프로필 수정</SheetTitle>
            <SheetDescription>이름과 연락처를 수정할 수 있습니다.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="profile-display-name">이름</Label>
              <Input
                id="profile-display-name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="이름을 입력하세요"
                disabled={profileSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">연락처</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="010-0000-0000"
                disabled={profileSaving}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSaveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default App;
