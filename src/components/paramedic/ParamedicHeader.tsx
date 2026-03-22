import { Switch } from "../ui/switch";
import { Ambulance } from 'lucide-react';

interface ParamedicHeaderProps {
  isOnline: boolean;
  tracking: boolean;
  onStatusToggle: (online: boolean) => void;
}

export function ParamedicHeader({ isOnline, tracking, onStatusToggle }: ParamedicHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Ambulance className="text-primary" />
            <span className="font-semibold text-lg">구급대원 대시보드</span>
          </div>
          <div className="flex items-center gap-3 ml-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isOnline
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                isOnline
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-red-500'
              }`} />
              {isOnline ? '온라인' : '오프라인'}
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={onStatusToggle}
              aria-label="온라인/오프라인 상태 전환"
            />
          </div>
        </div>
      </div>

      {tracking && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          GPS 실시간 추적 중 · 화면 꺼짐 방지 활성
        </div>
      )}
    </>
  );
}
