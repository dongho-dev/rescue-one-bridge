import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { InfoCard } from "../common/InfoCard";
import { useRequests } from "@/hooks/useRequests";
import { useBeds } from "@/hooks/useBeds";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { LoadingState } from "../common/LoadingState";
import type { Request } from "@/types/database";
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Phone,
  Heart,
  Activity,
  Brain,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const recentAlerts = [
  { time: '5분 전', message: '중증 환자 3명 동시 접수', type: 'warning' },
  { time: '12분 전', message: '병상 가용률 80% 달성', type: 'info' },
  { time: '20분 전', message: '응급실 대기시간 단축', type: 'success' },
];

export function HospitalDashboard() {
  const { profile } = useAuth();
  const [accepting, setAccepting] = useState(true);
  const [acceptingConfirmOpen, setAcceptingConfirmOpen] = useState(false);
  const [pendingAccepting, setPendingAccepting] = useState(true);
  const { requests: dbRequests, loading, error, refetch, rejectRequest } = useRequests();
  const { beds } = useBeds();
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const handleAcceptingToggleRequest = useCallback((isAccepting: boolean) => {
    setPendingAccepting(isAccepting);
    setAcceptingConfirmOpen(true);
  }, []);

  const handleAcceptingConfirm = useCallback(async () => {
    setAccepting(pendingAccepting);
    setAcceptingConfirmOpen(false);

    // DB에 accepting 상태 반영
    if (supabase && profile?.hospital_id) {
      const { error: updateError } = await supabase
        .from('hospitals')
        .update({ accepting: pendingAccepting })
        .eq('id', profile.hospital_id);
      if (updateError) {
        toast.error('수용 상태 업데이트에 실패했습니다');
        setAccepting(!pendingAccepting); // rollback
        return;
      }
    }
    toast(pendingAccepting ? "환자 수용을 시작합니다" : "환자 수용을 중단합니다");
  }, [pendingAccepting, profile?.hospital_id]);

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

  // 차트 데이터
  const [hourlyLoadData] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      patients: Math.floor(Math.random() * 15 + 5)
    }))
  );

  const severityDistributionData = [
    { name: '경미', value: dbRequests.filter(r => r.severity <= 2).length, color: 'var(--chart-3)' },
    { name: '보통', value: dbRequests.filter(r => r.severity === 3).length, color: 'var(--chart-4)' },
    { name: '심각', value: dbRequests.filter(r => r.severity >= 4).length, color: 'var(--chart-5)' },
  ];

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
                  <AlertDialogDescription>
                    {pendingAccepting
                      ? '환자 수용을 시작하시겠습니까?'
                      : '환자 수용을 중단하시겠습니까? 새로운 환자 요청을 받을 수 없게 됩니다.'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          title="가용 병상"
          value={kpiData.availableBeds}
          subtitle="현재 이용 가능"
          variant="success"
          icon={<Building2 size={18} />}
          trend={{ value: '2', positive: true }}
        />
        <InfoCard
          title="ER 대기열"
          value={`${kpiData.erQueue}명`}
          subtitle="현재 대기 중"
          variant="warning"
          icon={<Users size={18} />}
          trend={{ value: '3', positive: false }}
        />
        <InfoCard
          title="평균 대기시간"
          value={`${kpiData.avgWaitTime}분`}
          subtitle="최근 1시간 평균"
          variant="default"
          icon={<Clock size={18} />}
          trend={{ value: '12%', positive: true }}
        />
        <InfoCard
          title="오늘 처리"
          value={kpiData.todayProcessed}
          subtitle="완료된 케이스"
          variant="default"
          icon={<CheckCircle2 size={18} />}
          trend={{ value: '8%', positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 들어오는 요청 */}
        <div className="lg:col-span-2">
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
                      onClick={() => setSelectedSeverity(severity.toString())}
                    >
                      {getSeverityLabel(severity)}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={selectedSeverity === 'all' ? "default" : "outline"}
                    className="text-xs h-7 px-2.5"
                    onClick={() => setSelectedSeverity('all')}
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
                            <RequestDetailDialog request={request} onAccept={(id) => handleRequestAction(id, 'accept')} />
                            <Button
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleRequestAction(request.id, 'accept')}
                              aria-label="수락"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleRequestAction(request.id, 'reject')}
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

          {/* 중증도 분포 차트 */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">중증도 분포</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={severityDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={65}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {severityDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--card-foreground)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 시간대별 부하 차트 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp size={18} className="text-primary" />
            시간대별 환자 부하
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyLoadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--card-foreground)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="patients"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'var(--chart-1)', strokeWidth: 2, stroke: 'var(--background)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </LoadingState>
  );
}

function RequestDetailDialog({ request, onAccept }: { request: Request; onAccept: (requestId: string) => void }) {
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
              {request.patient_name && <>이름: {request.patient_name}<br/></>}
              {request.patient_age != null && <>연령: {request.patient_age}세<br/></>}
              {request.patient_gender && <>성별: {request.patient_gender}<br/></>}
              증상: {request.symptom}<br/>
              중증도: {request.severity}/5<br/>
              {request.notes && <>메모: {request.notes}<br/></>}
              {request.allergies?.length > 0 && `알레르기: ${request.allergies.join(', ')}`}
            </p>
          </div>
          <div>
            <h4 className="font-medium">위치 정보</h4>
            <p className="text-sm text-muted-foreground">
              {request.location_text && <>{request.location_text}<br/></>}
              거리: {request.distance_km != null ? `${request.distance_km}km` : '미확인'}<br/>
              예상 도착시간: {request.eta_minutes != null ? `${request.eta_minutes}분` : '미확인'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => onAccept(request.id)}>
              <Check size={16} className="mr-2" />
              수락
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => toast.info(`요청 ${request.id}에 대해 연락을 시도합니다.`)}>
              <Phone size={16} className="mr-2" />
              연락
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
