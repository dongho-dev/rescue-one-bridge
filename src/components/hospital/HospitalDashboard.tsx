import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { AmbulanceMap } from "../common/AmbulanceMap";
import { useRequestsContext } from "@/contexts/RequestsContext";
import { useBeds } from "@/hooks/useBeds";
import { useHospitalAccepting } from "@/hooks/useHospitalAccepting";
import { LoadingState } from "../common/LoadingState";
import { RequestChat } from "../common/RequestChat";
import { HospitalKPIs } from "./HospitalKPIs";
import { IncomingRequestsTable } from "./IncomingRequestsTable";
import { SeverityChart } from "./SeverityChart";
import { HourlyLoadChart } from "./HourlyLoadChart";
import { Building2 } from 'lucide-react';
import { toast } from "sonner";

export function HospitalDashboard() {
  const { accepting, setAccepting: updateAccepting } = useHospitalAccepting();
  const [acceptingConfirmOpen, setAcceptingConfirmOpen] = useState(false);
  const [pendingAccepting, setPendingAccepting] = useState(true);
  const { requests: dbRequests, loading, error, refetch, rejectRequest } = useRequestsContext();
  const { beds } = useBeds();
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const handleAcceptingToggleRequest = useCallback((isAccepting: boolean) => {
    setPendingAccepting(isAccepting);
    setAcceptingConfirmOpen(true);
  }, []);

  const handleAcceptingConfirm = useCallback(async () => {
    setAcceptingConfirmOpen(false);

    const success = await updateAccepting(pendingAccepting);
    if (success) {
      toast(pendingAccepting ? "환자 수용을 시작합니다" : "환자 수용을 중단합니다");
    }
  }, [pendingAccepting, updateAccepting]);

  const handleRequestAction = (requestId: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      // 이미 matched 상태이므로 수락 확인 토스트만
      toast.success("요청을 수락했습니다. 구급대원이 이송을 시작할 수 있습니다.");
    } else {
      rejectRequest(requestId);
      toast("요청을 거절했습니다. 다른 병원으로 재매칭됩니다.");
    }
  };

  // 자동 매칭된 요청(matched)도 들어오는 요청으로 표시
  const filteredRequests = useMemo(() => {
    const incoming = dbRequests.filter(req => req.status === 'pending' || req.status === 'matched');
    if (selectedSeverity === 'all') return incoming;
    return incoming.filter(req => req.severity.toString() === selectedSeverity);
  }, [dbRequests, selectedSeverity]);

  const kpiData = useMemo(() => {
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const erQueue = dbRequests.filter(req => req.status === 'matched' || req.status === 'en_route').length;
    const avgWaitTime = 25;
    const todayProcessed = dbRequests.filter(req => req.status === 'completed').length;
    return { availableBeds, erQueue, avgWaitTime, todayProcessed };
  }, [dbRequests, beds]);

  const recentAlerts = useMemo(() => {
    return dbRequests
      .slice(0, 5)
      .map(req => {
        const time = new Date(req.requested_at);
        const diff = Math.round((Date.now() - time.getTime()) / 60000);
        const timeStr = diff < 60 ? `${diff}분 전` : `${Math.round(diff / 60)}시간 전`;
        const type = req.severity >= 4 ? 'warning' : req.severity >= 3 ? 'info' : 'success';
        return {
          time: timeStr,
          message: `${req.patient_name || '환자'} - ${req.symptom} (중증도 ${req.severity})`,
          type,
        };
      });
  }, [dbRequests]);

  const getAlertBorderClass = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-4 border-l-amber-500';
      case 'info': return 'border-l-4 border-l-blue-500';
      case 'success': return 'border-l-4 border-l-green-500';
      default: return 'border-l-4 border-l-gray-300';
    }
  };

  const getAlertIconColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-amber-500';
      case 'info': return 'text-blue-500';
      case 'success': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const hourlyLoadData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) counts[i] = 0;
    dbRequests.forEach(req => {
      const hour = new Date(req.requested_at).getHours();
      counts[hour]++;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      patients: counts[i],
    }));
  }, [dbRequests]);

  const severityDistributionData = [
    { name: '경미', value: dbRequests.filter(r => r.severity <= 2).length, color: 'var(--chart-3)' },
    { name: '보통', value: dbRequests.filter(r => r.severity === 3).length, color: 'var(--chart-4)' },
    { name: '심각', value: dbRequests.filter(r => r.severity >= 4).length, color: 'var(--chart-5)' },
  ];

  const enRouteRequests = useMemo(() =>
    dbRequests.filter(r => r.status === 'en_route' && r.latitude && r.longitude),
  [dbRequests]);

  const ambulancePositions = useMemo(() =>
    enRouteRequests.map(r => ({
      id: r.id,
      latitude: r.latitude!,
      longitude: r.longitude!,
      eta_minutes: r.eta_minutes,
      severity: r.severity,
      patient_name: r.patient_name,
    })),
  [enRouteRequests]);

  const activeRequest = useMemo(() =>
    dbRequests.find(r => r.status === 'matched' || r.status === 'en_route'),
  [dbRequests]);

  return (
    <LoadingState loading={loading} error={error} onRetry={refetch}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="text-primary" size={22} />
              <span className="text-lg font-semibold">병원 응급실 대시보드</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`px-3 py-1 text-sm font-medium ${
                  accepting
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/50 dark:text-green-400 dark:border-green-700'
                    : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-700'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${accepting ? 'bg-green-500' : 'bg-red-500'}`} />
                {accepting ? '환자수용중' : '수용중단'}
              </Badge>
              <Switch
                checked={accepting}
                onCheckedChange={handleAcceptingToggleRequest}
                aria-label="환자 수용 상태 전환"
              />
              <AlertDialog open={acceptingConfirmOpen} onOpenChange={setAcceptingConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>수용 상태 변경 확인</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div>
                        {pendingAccepting
                          ? '환자 수용을 시작하시겠습니까?'
                          : '환자 수용을 중단하시겠습니까? 새로운 환자 요청을 받을 수 없게 됩니다.'}
                        {!pendingAccepting && kpiData.erQueue > 0 && (
                          <p className="mt-2 text-amber-600 dark:text-amber-400 font-medium">
                            ⚠️ 현재 이송 중이거나 배정된 요청이 {kpiData.erQueue}건 있습니다. 해당 이송은 계속 진행됩니다.
                          </p>
                        )}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAcceptingConfirm}>확인</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* KPI 카드 */}
        <HospitalKPIs
          availableBeds={kpiData.availableBeds}
          erQueue={kpiData.erQueue}
          avgWaitTime={kpiData.avgWaitTime}
          todayProcessed={kpiData.todayProcessed}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 들어오는 요청 */}
          <div className="lg:col-span-2">
            <IncomingRequestsTable
              filteredRequests={filteredRequests}
              selectedSeverity={selectedSeverity}
              onSeverityChange={setSelectedSeverity}
              onRequestAction={handleRequestAction}
            />
          </div>

          {/* 사이드 패널 */}
          <div className="space-y-6">
            {/* 실시간 알림 */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">실시간 알림</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3" aria-live="polite">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg bg-muted/40 ${getAlertBorderClass(alert.type)} transition-all hover:bg-muted/60`}
                  >
                    <p className={`text-sm font-medium ${getAlertIconColor(alert.type)}`}>{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {activeRequest && <RequestChat requestId={activeRequest.id} compact />}

            {/* 접근 중인 구급차 지도 */}
            {enRouteRequests.length > 0 && (
              <AmbulanceMap
                title="접근 중인 구급차"
                ambulancePositions={ambulancePositions}
                className="shadow-sm"
              />
            )}

            {/* 중증도 분포 차트 */}
            <SeverityChart data={severityDistributionData} />
          </div>
        </div>

        {/* 시간대별 부하 차트 */}
        <HourlyLoadChart data={hourlyLoadData} />
      </div>
    </LoadingState>
  );
}
