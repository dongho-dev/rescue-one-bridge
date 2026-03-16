import { useState, Suspense, lazy, useMemo } from 'react';
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { ThemeProvider, useTheme } from "./components/theme/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { UserRole } from "./contexts/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
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
  User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";

const HospitalDashboard = lazy(() => import('./components/hospital/HospitalDashboard').then(m => ({ default: m.HospitalDashboard })));
const PatientDetails = lazy(() => import('./components/hospital/PatientDetails').then(m => ({ default: m.PatientDetails })));
const BedManagement = lazy(() => import('./components/hospital/BedManagement').then(m => ({ default: m.BedManagement })));
const StaffManagement = lazy(() => import('./components/hospital/StaffManagement').then(m => ({ default: m.StaffManagement })));
const EquipmentStatus = lazy(() => import('./components/hospital/EquipmentStatus').then(m => ({ default: m.EquipmentStatus })));
const PatientRequest = lazy(() => import('./components/paramedic/PatientRequest').then(m => ({ default: m.PatientRequest })));

type CurrentPage = 'dashboard' | 'patients' | 'beds' | 'staff' | 'equipment' | 'request';

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

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rescue-one-theme">
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}

function AuthGate() {
  const { user, loading, isDemoMode } = useAuth();
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

  // Demo mode: skip login, go straight to app
  if (isDemoMode) {
    return <AppContent />;
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
  const { user, profile, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<CurrentPage>(() => {
    // Default page based on role
    if (profile?.role === 'paramedic') return 'request';
    return 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = useMemo(() => {
    if (!profile?.role) return allNavigationItems;
    return allNavigationItems.filter(item =>
      item.roles.includes(profile.role)
    );
  }, [profile?.role]);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Demo User';
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
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sidebar-accent rounded-lg shrink-0">
                <User size={16} className="text-sidebar-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="shrink-0 text-sidebar-foreground/70 hover:text-red-500"
                aria-label="로그아웃"
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full text-sidebar-foreground/70 hover:text-red-500"
              aria-label="로그아웃"
            >
              <LogOut size={16} />
            </Button>
          )}
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
              <button onClick={() => setMobileMenuOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
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
                <div className="p-2 bg-sidebar-accent rounded-lg shrink-0">
                  <User size={16} className="text-sidebar-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="shrink-0 text-sidebar-foreground/70 hover:text-red-500"
                  aria-label="로그아웃"
                >
                  <LogOut size={16} />
                </Button>
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
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950 hidden sm:flex">● 시스템 정상</Badge>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">로딩 중...</p></div>}>
            {currentPage === 'dashboard' && <HospitalDashboard />}
            {currentPage === 'patients' && <PatientDetails />}
            {currentPage === 'beds' && <BedManagement />}
            {currentPage === 'staff' && <StaffManagement />}
            {currentPage === 'equipment' && <EquipmentStatus />}
            {currentPage === 'request' && <PatientRequest />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
