import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  Ambulance,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { HospitalAvailability, Request, RequestStatus } from "@/types/database";
import { RequestRow } from "./RequestRow";

interface ParamedicRequestTableProps {
  activeRequests: Request[];
  displayedRequests: Request[];
  showAllRequests: boolean;
  hospitals: HospitalAvailability[];
  onToggleShowAll: () => void;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  getSeverityLabel: (severity: number) => string;
  getStatusBadge: (status: RequestStatus) => React.ReactNode;
}

export function ParamedicRequestTable({
  activeRequests,
  displayedRequests,
  showAllRequests,
  hospitals,
  onToggleShowAll,
  onStatusUpdate,
  getSeverityLabel,
  getStatusBadge,
}: ParamedicRequestTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle size={18} className="text-amber-500" />
          내 요청 현황
          <Badge variant="secondary" className="ml-2 text-xs">
            {activeRequests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length}건 활성
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Ambulance size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">아직 요청이 없습니다</p>
            <p className="text-xs mt-1">구급대원 요청 페이지에서 새 요청을 생성하세요</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">접수시각</TableHead>
                    <TableHead className="font-semibold">환자</TableHead>
                    <TableHead className="font-semibold">증상</TableHead>
                    <TableHead className="font-semibold">상태</TableHead>
                    <TableHead className="font-semibold">병원/거리</TableHead>
                    <TableHead className="font-semibold">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRequests.map((request) => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      onStatusUpdate={onStatusUpdate}
                      getSeverityLabel={getSeverityLabel}
                      getStatusBadge={getStatusBadge}
                      hospitals={hospitals}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            {activeRequests.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={onToggleShowAll}
              >
                {showAllRequests ? (
                  <>접기 <ChevronUp size={14} className="ml-1" /></>
                ) : (
                  <>전체 {activeRequests.length}건 보기 <ChevronDown size={14} className="ml-1" /></>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
