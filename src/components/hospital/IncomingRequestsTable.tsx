import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { RequestDetailDialog } from "./RequestDetailDialog";
import type { Request } from "@/types/database";
import { AlertTriangle, Check, XCircle, Heart, Brain, Activity } from 'lucide-react';

interface IncomingRequestsTableProps {
  filteredRequests: Request[];
  selectedSeverity: string;
  onSeverityChange: (severity: string) => void;
  onRequestAction: (requestId: string, action: 'accept' | 'reject') => void;
}

const getSeverityBadgeClasses = (severity: number) => {
  if (severity >= 4) return 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
  if (severity >= 3) return 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800';
  return 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800';
};

const getSeverityLabel = (severity: number) => {
  const labels = ['', '경미', '보통', '주의', '위험', '응급'];
  return labels[severity] || '';
};

const getSymptomIcon = (symptom: string) => {
  if (symptom.includes('심') || symptom.includes('흉')) return <Heart size={16} />;
  if (symptom.includes('뇌') || symptom.includes('의식')) return <Brain size={16} />;
  return <Activity size={16} />;
};

export function IncomingRequestsTable({
  filteredRequests,
  selectedSeverity,
  onSeverityChange,
  onRequestAction,
}: IncomingRequestsTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle size={18} className="text-amber-500" />
            들어오는 요청
            <Badge variant="secondary" className="ml-2 text-xs">
              {filteredRequests.length}건
            </Badge>
          </CardTitle>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(severity => (
              <Button
                key={severity}
                size="sm"
                variant={selectedSeverity === severity.toString() ? "default" : "outline"}
                className="text-xs h-7 px-2.5"
                onClick={() => onSeverityChange(severity.toString())}
              >
                {getSeverityLabel(severity)}
              </Button>
            ))}
            <Button
              size="sm"
              variant={selectedSeverity === 'all' ? "default" : "outline"}
              className="text-xs h-7 px-2.5"
              onClick={() => onSeverityChange('all')}
            >
              전체
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">접수시각</TableHead>
              <TableHead className="font-semibold">중증도</TableHead>
              <TableHead className="font-semibold">거리/ETA</TableHead>
              <TableHead className="font-semibold">증상</TableHead>
              <TableHead className="font-semibold">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-lg font-medium">검색 결과가 없습니다</p>
                    <p className="text-sm mt-1">필터 조건을 변경해 보세요</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.slice(0, 6).map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-sm">
                    {new Date(request.requested_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getSeverityBadgeClasses(request.severity)}
                    >
                      {getSeverityLabel(request.severity)} ({request.severity})
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {request.distance_km}km / <span className="font-medium">{request.eta_minutes}분</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{getSymptomIcon(request.symptom)}</span>
                      <span className="text-sm">{request.symptom}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <RequestDetailDialog request={request} onAccept={(id) => onRequestAction(id, 'accept')} />
                      <Button
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => onRequestAction(request.id, 'accept')}
                        aria-label="수락"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => onRequestAction(request.id, 'reject')}
                        aria-label="거절"
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
