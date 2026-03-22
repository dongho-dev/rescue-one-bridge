import { Button } from "../ui/button";
import { TableCell, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import {
  Truck,
  CheckCircle2,
  XCircle,
  Navigation,
} from 'lucide-react';
import type { HospitalAvailability, Request, RequestStatus } from "@/types/database";

interface RequestRowProps {
  request: Request;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  getSeverityLabel: (s: number) => string;
  getStatusBadge: (s: RequestStatus) => React.ReactNode;
  hospitals: HospitalAvailability[];
}

export function RequestRow({
  request,
  onStatusUpdate,
  getSeverityLabel,
  getStatusBadge,
  hospitals,
}: RequestRowProps) {
  const isTerminal = request.status === 'completed' || request.status === 'cancelled';

  return (
    <TableRow className={`hover:bg-muted/50 transition-colors ${isTerminal ? 'opacity-50' : ''}`}>
      <TableCell className="font-mono text-sm whitespace-nowrap">
        {new Date(request.requested_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        <span className="block text-xs text-muted-foreground">
          {new Date(request.requested_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">{request.patient_name || '미상'}</span>
        <span className="block text-xs text-muted-foreground">
          {request.patient_age ? `${request.patient_age}세` : ''} {getSeverityLabel(request.severity)}
        </span>
      </TableCell>
      <TableCell className="text-sm">{request.symptom}</TableCell>
      <TableCell>{getStatusBadge(request.status)}</TableCell>
      <TableCell className="text-sm">
        {request.hospital_id ? (
          <span>
            <span className="font-medium">{hospitals.find(h => h.hospital_id === request.hospital_id)?.hospital_name ?? '병원 배정됨'}</span>
            {request.distance_km != null && (
              <span className="block text-xs text-muted-foreground">{request.distance_km}km</span>
            )}
            {request.eta_minutes != null && (
              <span className="text-muted-foreground text-xs"> / {request.eta_minutes}분</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">미배정</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          {request.status === 'matched' && (
            <Button
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => onStatusUpdate(request.id, 'en_route')}
            >
              <Truck size={13} className="mr-1" />
              이송 시작
            </Button>
          )}
          {request.status === 'en_route' && (
            <Button
              size="sm"
              className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700"
              onClick={() => onStatusUpdate(request.id, 'completed')}
            >
              <CheckCircle2 size={13} className="mr-1" />
              이송 완료
            </Button>
          )}
          {(request.status === 'pending' || request.status === 'matched') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <XCircle size={13} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>이송 취소 확인</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 이송 요청을 취소하시겠습니까? 이 작업은 취소할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>닫기</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onStatusUpdate(request.id, 'cancelled')}>
                    취소 확인
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {(request.status === 'matched' || request.status === 'en_route') && request.hospital_id && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&origin=${request.latitude},${request.longitude}&travelmode=driving`;
                window.open(url, '_blank');
              }}
            >
              <Navigation size={13} className="mr-1" />
              길 안내
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
