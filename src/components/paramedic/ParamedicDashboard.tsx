import { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { useRequestsContext } from '@/contexts/RequestsContext';
import { useHospitalAvailability } from '@/hooks/useHospitalAvailability';
import { useGeolocation, calculateDistanceKm } from '@/hooks/useGeolocation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { generateMockHospitals } from '../common/models';
import type { RequestStatus } from '@/types/database';
import { LoadingState } from '../common/LoadingState';
import { RequestChat } from '../common/RequestChat';
import { toast } from 'sonner';
import { ParamedicHeader } from './ParamedicHeader';
import { ParamedicKPIs } from './ParamedicKPIs';
import { ParamedicRequestTable } from './ParamedicRequestTable';
import { HospitalAvailabilityPanel } from './HospitalAvailabilityPanel';

export function ParamedicDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const {
    hospitals: dbHospitals,
    loading: hospitalsLoading,
    error: hospitalsError,
    refetch: refetchHospitals,
  } = useHospitalAvailability();
  const {
    requests: dbRequests,
    loading: requestsLoading,
    error: requestsError,
    updateRequestStatus,
  } = useRequestsContext();
  const { position, tracking, startTracking, stopTracking } = useGeolocation();
  const wakeLock = useWakeLock();
  const rawHospitals = dbHospitals.length > 0 ? dbHospitals : generateMockHospitals();

  // matched 또는 en_route 상태의 활성 채팅용 요청
  const activeChatRequest = useMemo(
    () => dbRequests.find((r) => r.status === 'matched' || r.status === 'en_route'),
    [dbRequests],
  );

  // 이송 중인 요청의 위치를 병원에 실시간 공유 (위치 공유는 en_route만)
  const enRouteRequest = useMemo(
    () => dbRequests.find((r) => r.status === 'en_route'),
    [dbRequests],
  );
  useLocationSharing(enRouteRequest?.id ?? null, position, !!enRouteRequest);

  // GPS 위치 기반 거리 계산 + 가까운 순 정렬
  const hospitals = useMemo(() => {
    const mapped = rawHospitals.map((h) => {
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
    toast(online ? '온라인 상태로 전환되었습니다' : '오프라인 상태로 전환되었습니다');
  };

  const statusCounts = useMemo(() => {
    const counts = dbRequests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      pending: counts.pending || 0,
      matched: counts.matched || 0,
      enRoute: counts.en_route || 0,
      completed: counts.completed || 0,
    };
  }, [dbRequests]);

  // 활성 요청 (pending, matched, en_route) 우선, 최신순
  const activeRequests = useMemo(() => {
    const active = dbRequests.filter((r) => r.status !== 'completed' && r.status !== 'cancelled');
    const inactive = dbRequests.filter((r) => r.status === 'completed' || r.status === 'cancelled');
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
      pending: {
        label: '대기중',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      },
      matched: {
        label: '배정됨',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
      },
      en_route: {
        label: '이송중',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
      },
      completed: {
        label: '완료',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
      },
      cancelled: {
        label: '취소됨',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
      },
    };
    const c = config[status];
    return (
      <Badge variant="outline" className={`${c.className} border-0 text-xs font-medium`}>
        {c.label}
      </Badge>
    );
  };

  const getSeverityLabel = (severity: number) => {
    const labels = ['', '경미', '보통', '주의', '위험', '응급'];
    return labels[severity] || '';
  };

  return (
    <LoadingState loading={loading} error={error} onRetry={refetchHospitals}>
      <div className="space-y-6">
        <ParamedicHeader
          isOnline={isOnline}
          tracking={tracking}
          onStatusToggle={handleStatusToggle}
        />

        <ParamedicKPIs statusCounts={statusCounts} />

        <ParamedicRequestTable
          activeRequests={activeRequests}
          displayedRequests={displayedRequests}
          showAllRequests={showAllRequests}
          hospitals={dbHospitals}
          onToggleShowAll={() => setShowAllRequests(!showAllRequests)}
          onStatusUpdate={handleStatusUpdate}
          getSeverityLabel={getSeverityLabel}
          getStatusBadge={getStatusBadge}
        />

        {activeChatRequest && <RequestChat requestId={activeChatRequest.id} />}

        <HospitalAvailabilityPanel
          hospitals={hospitals}
          rawHospitals={rawHospitals}
          position={position}
        />
      </div>
    </LoadingState>
  );
}
