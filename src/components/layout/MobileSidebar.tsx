import { Building2, X, User, LogOut } from 'lucide-react';
import { Button } from "../ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import type { CurrentPage, NavigationItem } from './types';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  currentPage: CurrentPage;
  onNavigate: (page: CurrentPage) => void;
  displayName: string;
  roleLabel: string;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export function MobileSidebar({
  open,
  onClose,
  navigationItems,
  currentPage,
  onNavigate,
  displayName,
  roleLabel,
  onOpenProfile,
  onSignOut,
}: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
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
          <button onClick={onClose} className="text-sidebar-foreground/70 hover:text-sidebar-foreground" aria-label="메뉴 닫기">
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
                  onNavigate(item.id as CurrentPage);
                  onClose();
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
              onClick={onOpenProfile}
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
                  <AlertDialogAction onClick={onSignOut}>로그아웃</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </aside>
    </div>
  );
}
