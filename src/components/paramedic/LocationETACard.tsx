import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, Clock, Navigation } from 'lucide-react';

interface LocationETACardProps {
  currentLocation: string;
  estimatedTime: string;
  onLocationUpdate: () => void;
}

export function LocationETACard({
  currentLocation,
  estimatedTime,
  onLocationUpdate,
}: LocationETACardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MapPin className="text-blue-600 dark:text-blue-400" size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">현재 위치</span>
            </div>
            <Button variant="outline" size="sm" onClick={onLocationUpdate} className="h-8">
              <Navigation size={14} className="mr-1" />
              위치 업데이트
            </Button>
          </div>
          <p className="mt-2.5 text-sm font-medium pl-9">{currentLocation}</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Clock className="text-amber-600 dark:text-amber-400" size={16} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">예상 도착 시간</span>
          </div>
          <p className="mt-2.5 text-2xl font-bold pl-9 text-amber-700 dark:text-amber-400">
            {estimatedTime}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
