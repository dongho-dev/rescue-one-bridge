import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { InfoCard } from "../common/InfoCard";
import { AmbulanceMap } from "../common/AmbulanceMap";
import { useRequests } from "@/hooks/useRequests";
import { useHospitalAvailability } from "@/hooks/useHospitalAvailability";
import { useGeolocation, calculateDistanceKm } from "@/hooks/useGeolocation";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { generateMockHospitals } from "../common/models";
import type { HospitalAvailability, Request, RequestStatus } from "@/types/database";
import { LoadingState } from "../common/LoadingState";
import { RequestChat } from "../common/RequestChat";
import {
  Ambulance,
  Phone,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Bed,
  Route,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Navigation,
} from 'lucide-react';
import { toast } from "sonner";

export function ParamedicDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const { hospitals: dbHospitals, loading: hospitalsLoading, error: hospitalsError, refetch: refetchHospitals } = useHospitalAvailability();
  const { requests: dbRequests, loading: requestsLoading, error: requestsError, updateRequestStatus } = useRequests();
  const { position, tracking, startTracking, stopTracking } = useGeolocation();
  const wakeLock = useWakeLock();
  const rawHospitals = dbHospitals.length > 0 ? dbHospitals : generateMockHospitals();

  // 이송 중인 요청의 위치를 병원에 실시간 공유
  const enRouteRequest = useMemo(() => dbRequests.find(r => r.status === 'en_route'), [dbRequests]);
  useLocationSharing(enRouteRequest?.id ?? null, position, !!enRouteRequest);

  // GPS 위치 기반 거리 계산 + 가까운 순 정렬
  const hospitals = useMemo(() => {
    const mapped = rawHospitals.map(h => {
      const lat = 'latitude' in h ? h.latitude : undefined;
      const lng = 'longitude' in h ? h.longitude : undefined;
      let computedDist: number | null = null;
      if (position && typeof lat === 'number' && typeof lng === 'number') {
        computedDist = calculateDistanceKm(position.latitude, position.longitude, lat, lng);
      }
      const existingDist = 'distance_km' in h ? h.distance_km : null;
      return { ...h, distance_km: computedDist ?? existingDist };
    });
    return mapped.sort((a, b) => {
      if (a.distance_km == null && b.distance_km == null) return 0;
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
  }, [rawHospitals, position]);

  const loading = hospitalsLoading || requestsLoading;
  const error = hospitalsError || requestsError;

  const handleStatusToggle = (online: boolean) => {
    setIsOnline(online);
    toast(online ? "온라인 상태로 전환되었습니다" : "오프라인 상태로 전환되었습니다");
  };

  const statusCounts = useMemo(() => {
    const counts = dbRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pending: counts.pending || 0,
      matched: counts.matched || 0,
      enRoute: counts.en_route || 0,
      completed: counts.completed || 0
    };
  }, [dbRequests]);

  // 활성 요청 (pending, matched, en_route) 우선, 최신순
  const activeRequests = useMemo(() => {
    const active = dbRequests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
    const inactive = dbRequests.filter(r => r.status === 'completed' || r.status === 'cancelled');
    return [...active, ...inactive];
  }, [dbRequests]);

  const displayedRequests = showAllRequests ? activeRequests : activeRequests.slice(0, 5);

  const handleStatusUpdate = async (requestId: string, newStatus: RequestStatus) => {
    await updateRequestStatus(requestId, newStatus);

    if (newStatus === 'en_route') {
      startTracking();
      wakeLock.request();
      toast.success('이송을 시작합니다. GPS 추적 및 화면 유지가 활성화됩니다.');
    } else if (newStatus === 'completed' || newStatus === 'cancelled') {
      stopTracking();
      wakeLock.release();
      toast.success(newStatus === 'completed' ? '이송이 완료되었습니다' : '요청이 취소되었습니다');
    } else {
      toast.success('상태가 변경되었습니다');
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const config: Record<RequestStatus, { label: string; className: string }> = {
      pending: { label: '대기중', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
      matched: { label: '배정됨', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' },
      en_route: { label: '이송중', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
      completed: { label: '완료', className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' },
      cancelled: { label: '취소됨', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
    };
    const c = config[status];
    return <Badge variant="outline" className={`${c.className} border-0 text-xs font-medium`}>{c.label}</Badge>;
  };

  const getSeverityLabel = (severity: number) => {
    const labels = ['', '경미', '보통', '주의', '위험', '응급'];
    return labels[severity] || '';
  };

  return (
    <LoadingState loading={loading} error={error} onRetry={refetchHospitals}>
      <div className="space-y-6">
      {/* 헤더 */}
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
              onCheckedChange={handleStatusToggle}
              aria-label="온라인/오프라인 상태 전환"
            />
          </div>
        </div>
      </div>

      {/* GPS 추적 상태 */}
      {tracking && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          GPS 실시간 추적 중 · 화면 꺼짐 방지 활성
        </div>
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard
          title="대기"
          value={statusCounts.pending}
          subtitle="매칭 대기"
          variant="default"
          icon={<Clock size={16} />}
        />
        <InfoCard
          title="배정됨"
          value={statusCounts.matched}
          subtitle="병원 배정 완료"
          variant="warning"
          icon={<CheckCircle2 size={16} />}
        />
        <InfoCard
          title="이송 중"
          value={statusCounts.enRoute}
          subtitle="병원으로 이송"
          variant="success"
          icon={<Ambulance size={16} />}
        />
        <InfoCard
          title="완료"
          value={statusCounts.completed}
          subtitle="오늘 처리"
          variant="default"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      {/* 내 요청 목록 */}
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
                        onStatusUpdate={handleStatusUpdate}
                        getSeverityLabel={getSeverityLabel}
                        getStatusBadge={getStatusBadge}
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
                  onClick={() => setShowAllRequests(!showAllRequests)}
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

      {enRouteRequest && (
        <RequestChat requestId={enRouteRequest.id} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 병원 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={16} />
              근처 병원 수용 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hospitals.slice(0, 5).map((h) => {
              const hospital = normalizeHospital(h);
              return <HospitalCard key={hospital.id} hospital={hospital} />;
            })}
          </CardContent>
        </Card>

        {/* 지도 */}
        <AmbulanceMap
          title="실시간 위치"
          ambulancePosition={position}
          hospitals={rawHospitals
            .filter(h => {
              const lat = 'latitude' in h ? h.latitude : undefined;
              const lng = 'longitude' in h ? h.longitude : undefined;
              return typeof lat === 'number' && typeof lng === 'number';
            })
            .map(h => {
              const hospital = normalizeHospital(h);
              return {
                id: hospital.id,
                name: hospital.name,
                latitude: ('latitude' in h ? h.latitude : 0) as number,
                longitude: ('longitude' in h ? h.longitude : 0) as number,
                accepting: hospital.accepting,
                available_beds: hospital.available_beds,
              };
            })}
        />
      </div>
    </div>
    </LoadingState>
  );
}

function RequestRow({
  request,
  onStatusUpdate,
  getSeverityLabel,
  getStatusBadge,
}: {
  request: Request;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  getSeverityLabel: (s: number) => string;
  getStatusBadge: (s: RequestStatus) => React.ReactNode;
}) {
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
            {request.distance_km != null && `${request.distance_km}km`}
            {request.eta_minutes != null && (
              <span className="text-muted-foreground"> / {request.eta_minutes}분</span>
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
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => onStatusUpdate(request.id, 'cancelled')}
            >
              <XCircle size={13} />
            </Button>
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

type HospitalDisplay = {
  id: string;
  name: string;
  accepting: boolean;
  queue: number;
  available_beds: number;
  specialties: string[];
  contact: string | null;
  distance_km: number | null;
  avg_wait_time: number | null;
};

function normalizeHospital(h: HospitalAvailability | ReturnType<typeof generateMockHospitals>[number]): HospitalDisplay {
  if ('hospital_id' in h) {
    return {
      id: h.hospital_id,
      name: h.hospital_name,
      accepting: h.accepting,
      queue: h.queue,
      available_beds: h.available_beds,
      specialties: h.specialties,
      contact: h.contact,
      distance_km: null,
      avg_wait_time: h.avg_wait_time,
    };
  }
  return {
    id: h.id,
    name: h.name,
    accepting: h.accepting,
    queue: h.queue,
    available_beds: h.available_beds,
    specialties: h.specialties,
    contact: h.contact ?? null,
    distance_km: h.distance_km,
    avg_wait_time: h.avg_wait_time ?? null,
  };
}

function getBedCountColor(available_beds: number): string {
  if (available_beds === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  if (available_beds <= 3) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
}

function HospitalCard({ hospital }: { hospital: HospitalDisplay }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full text-left p-4 border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-medium text-sm">{hospital.name}</h4>
            <Badge variant={hospital.accepting ? "default" : "destructive"}>
              {hospital.accepting ? "수용가능" : "수용불가"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
              <Route size={11} />
              {hospital.distance_km != null ? `${hospital.distance_km}km` : '거리 미확인'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
              <Clock size={11} />
              대기 {hospital.queue}명
            </Badge>
            <Badge className={`flex items-center gap-1 text-xs font-medium border-0 ${getBedCountColor(hospital.available_beds)}`}>
              <Bed size={11} />
              병상 {hospital.available_beds}개
            </Badge>
          </div>
          <div className="flex gap-1.5">
            {hospital.specialties.slice(0, 3).map((specialty, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{specialty}</Badge>
            ))}
          </div>
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{hospital.name}</SheetTitle>
          <SheetDescription>병원 상세 정보</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">수용 상태</p>
            <Badge variant={hospital.accepting ? "default" : "destructive"} className="mt-1">
              {hospital.accepting ? "수용 가능" : "수용 불가"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">거리 및 대기 정보</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">거리</p>
                <p className="text-sm font-semibold">{hospital.distance_km != null ? `${hospital.distance_km}km` : '거리 미확인'}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">ER 대기</p>
                <p className="text-sm font-semibold">{hospital.queue}명</p>
              </div>
              <div className={`p-2 rounded-lg text-center ${getBedCountColor(hospital.available_beds)}`}>
                <p className="text-xs opacity-80">가용 병상</p>
                <p className="text-sm font-semibold">{hospital.available_beds}개</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">평균 대기</p>
                <p className="text-sm font-semibold">{hospital.avg_wait_time != null ? `${hospital.avg_wait_time}분` : '-'}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">전문 진료과</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {hospital.specialties.map((specialty, i) => (
                <Badge key={i} variant="outline">{specialty}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">연락처</p>
            <p className="text-sm mt-1 font-medium">{hospital.contact}</p>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (hospital.contact) {
                window.open(`tel:${hospital.contact}`);
              } else {
                toast("연락처 정보가 없습니다");
              }
            }}
          >
            <Phone size={16} className="mr-2" />
            병원 연락하기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
