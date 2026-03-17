import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function LoadingState({ loading, error, onRetry, children }: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
          <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-medium">데이터 로딩 실패</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw size={14} className="mr-2" />
            다시 시도
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
