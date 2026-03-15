import { useState, Suspense, lazy } from 'react';
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { ThemeProvider, useTheme } from "./components/theme/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
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
  Ambulance
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";

const HospitalDashboard = lazy(() => import('./components/hospital/HospitalDashboard').then(m => ({ default: m.HospitalDashboard })));
const PatientDetails = lazy(() => import('./components/hospital/PatientDetails').then(m => ({ default: m.PatientDetails })));
const BedManagement = lazy(() => import('./components/hospital/BedManagement').then(m => ({ default: m.BedManagement })));
const StaffManagement = lazy(() => import('./components/hospital/StaffManagement').then(m => ({ default: m.StaffManagement })));
const EquipmentStatus = lazy(() => import('./components/hospital/EquipmentStatus').then(m => ({ default: m.EquipmentStatus })));
const PatientRequest = lazy(() => import('./components/paramedic/PatientRequest').then(m => ({ default: m.PatientRequest })));

type CurrentPage = 'dashboard' | 'patients' | 'beds' | 'staff' | 'equipment' | 'request';

const navigationItems = [
  { id: 'dashboard', label: '대시보드', icon: Home },
  { id: 'patients', label: '환자 관리', icon: Users },
  { id: 'beds', label: '병상 관리', icon: Bed },
  { id: 'staff', label: '직원 관리', icon: UserCheck },
  { id: 'equipment', label: '장비 현황', icon: Stethoscope },
  { id: 'request', label: '구급대원 요청', icon: Ambulance },
] as const;

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
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="font-semibold">Rescue One Bridge</span>
                  <Badge variant="secondary" className="ml-2">병원 응급실</Badge>
                </div>
              </div>
              
              {/* Navigation */}
              <nav aria-label="메인 메뉴" className="hidden md:flex items-center gap-2 ml-8">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(item.id as CurrentPage)}
                      className="flex items-center gap-2"
                    >
                      <Icon size={16} />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
            <ThemeToggle />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden mt-3">
            <nav aria-label="모바일 메뉴" className="flex gap-1 overflow-x-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(item.id as CurrentPage)}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon size={14} />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><p>로딩 중...</p></div>}>
          {currentPage === 'dashboard' && <HospitalDashboard />}
          {currentPage === 'patients' && <PatientDetails />}
          {currentPage === 'beds' && <BedManagement />}
          {currentPage === 'staff' && <StaffManagement />}
          {currentPage === 'equipment' && <EquipmentStatus />}
          {currentPage === 'request' && <PatientRequest />}
        </Suspense>
      </div>
    </div>
  );
}

export default App;