import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MapPin, Navigation, Route } from "lucide-react";

interface MiniMapPlaceholderProps {
  title?: string;
  ambulanceLocation?: string;
  hospitalLocation?: string;
  showRoute?: boolean;
}

export function MiniMapPlaceholder({ 
  title = "위치 정보", 
  ambulanceLocation = "강남구 테헤란로", 
  hospitalLocation = "서초구 반포대로",
  showRoute = true 
}: MiniMapPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation size={16} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-muted rounded-lg p-4 h-48 flex items-center justify-center">
          {/* 지도 플레이스홀더 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg opacity-50"></div>
          
          {/* 위치 정보 */}
          <div className="relative z-10 space-y-4 w-full">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">구급차: {ambulanceLocation}</span>
            </div>
            
            {showRoute && (
              <div className="flex items-center justify-center">
                <Route className="text-blue-500" size={24} />
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className="font-medium">병원: {hospitalLocation}</span>
            </div>
          </div>
          
          {/* 플레이스홀더 텍스트 */}
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            지도 플레이스홀더
          </div>
        </div>
      </CardContent>
    </Card>
  );
}