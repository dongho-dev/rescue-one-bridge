import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { Request } from '@/types/database';
import { Eye, Check, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { RequestChat } from '../common/RequestChat';

interface RequestDetailDialogProps {
  request: Request;
  onAccept: (requestId: string) => void;
}

export function RequestDetailDialog({ request, onAccept }: RequestDetailDialogProps) {
  const { log } = useAuditLog();

  const handleAccept = (requestId: string) => {
    log('view', 'request', requestId);
    onAccept(requestId);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2" aria-label="상세보기">
          <Eye size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>케이스 상세정보</DialogTitle>
          <DialogDescription>요청 ID: {request.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">환자 정보</h4>
            <p className="text-sm text-muted-foreground">
              {request.patient_name && (
                <>
                  이름: {request.patient_name}
                  <br />
                </>
              )}
              {request.patient_age != null && (
                <>
                  연령: {request.patient_age}세<br />
                </>
              )}
              {request.patient_gender && (
                <>
                  성별: {request.patient_gender}
                  <br />
                </>
              )}
              증상: {request.symptom}
              <br />
              중증도: {request.severity}/5
              <br />
              {request.notes && (
                <>
                  메모: {request.notes}
                  <br />
                </>
              )}
              {request.allergies?.length > 0 && `알레르기: ${request.allergies.join(', ')}`}
            </p>
          </div>
          <div>
            <h4 className="font-medium">위치 정보</h4>
            <p className="text-sm text-muted-foreground">
              {request.location_text && (
                <>
                  {request.location_text}
                  <br />
                </>
              )}
              거리: {request.distance_km != null ? `${request.distance_km}km` : '미확인'}
              <br />
              예상 도착시간: {request.eta_minutes != null ? `${request.eta_minutes}분` : '미확인'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleAccept(request.id)}>
              <Check size={16} className="mr-2" />
              수락
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => toast.info(`요청 ${request.id}에 대해 연락을 시도합니다.`)}
            >
              <Phone size={16} className="mr-2" />
              연락
            </Button>
          </div>
          <Separator />
          <RequestChat requestId={request.id} compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}
