import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { InfoCard } from "../common/InfoCard";
import { MiniMapPlaceholder } from "../common/MiniMapPlaceholder";
import { generateMockRequests, generateMockHospitals, MockHospital } from "../common/models";
import {
  Ambulance,
  Phone,
  Share2,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Bed,
  Route
} from 'lucide-react';
import { toast } from "sonner";

const recentEvents = [
  { time: '10분 전', message: '서울대병원 수용 가능 상태 전환', type: 'info' },
  { time: '15분 전', message: 'Case #RQ-1023 배정 완료', type: 'success' },
  { time: '23분 전', message: '응급호출 3건 신규 접수', type: 'warning' },
];

export function ParamedicDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [hospitals] = useState(generateMockHospitals());
  const [requests] = useState(generateMockRequests());

  const handleStatusToggle = (online: boolean) => {
    setIsOnline(online);
    toast(online ? "온라인 상태로 전환되었습니다" : "오프라인 상태로 전환되었습니다");
  };

  const getStatusCounts = () => {
    const counts = requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pending: counts.pending || 0,
      matched: counts.matched || 0,
      enRoute: counts.enRoute || 0,
      completed: counts.completed || 0
    };
  };

  const statusCounts = getStatusCounts();

  const getEventColorBar = (type: string) => {
    switch (type) {
      case 'info': return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      case 'success': return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
      case 'warning': return 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      default: return 'border-l-4 border-l-gray-500 bg-muted/50';
    }
  };

  return (
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
              aria-label="온/오프라인 상태 전환"
            />
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          title="대기"
          value={statusCounts.pending}
          subtitle="새로운 요청"
          variant="default"
          icon={<Clock size={16} />}
        />
        <InfoCard
          title="배정됨"
          value={statusCounts.matched}
          subtitle="배정 완료"
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
            {hospitals.slice(0, 5).map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} />
            ))}
          </CardContent>
        </Card>

        {/* 지도 및 액션 */}
        <div className="space-y-4">
          <MiniMapPlaceholder
            title="실시간 위치"
            ambulanceLocation="강남구 테헤란로 123"
            hospitalLocation="서초구 반포대로 456"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="w-full"
              onClick={() => toast("ETA 정보가 공유되었습니다")}
            >
              <Share2 size={16} className="mr-2" />
              상태 공유
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast("병원에 연락 중...")}
            >
              <Phone size={16} className="mr-2" />
              병원 연락
            </Button>
          </div>
        </div>
      </div>

      {/* 실시간 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={16} />
            실시간 알림
          </CardTitle>
        </CardHeader>
        <CardContent aria-live="polite">
          <div className="space-y-2">
            {recentEvents.map((event, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${getEventColorBar(event.type)}`}
              >
                <span className="text-sm font-medium">{event.message}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getBedCountColor(beds: number): string {
  if (beds === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  if (beds <= 3) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
}

function HospitalCard({ hospital }: { hospital: MockHospital }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full text-left p-4 border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01]" aria-label={`${hospital.name} 상세 정보 보기`}>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-medium text-sm">{hospital.name}</h4>
            <Badge variant={hospital.accepting ? "default" : "destructive"}>
              {hospital.accepting ? "수용가능" : "수용불가"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
              <Route size={11} />
              {hospital.distanceKm}km
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
              <Clock size={11} />
              대기 {hospital.queue}명
            </Badge>
            <Badge className={`flex items-center gap-1 text-xs font-medium border-0 ${getBedCountColor(hospital.beds)}`}>
              <Bed size={11} />
              병상 {hospital.beds}개
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
                <p className="text-sm font-semibold">{hospital.distanceKm}km</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">ER 대기</p>
                <p className="text-sm font-semibold">{hospital.queue}명</p>
              </div>
              <div className={`p-2 rounded-lg text-center ${getBedCountColor(hospital.beds)}`}>
                <p className="text-xs opacity-80">가용 병상</p>
                <p className="text-sm font-semibold">{hospital.beds}개</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">평균 대기</p>
                <p className="text-sm font-semibold">{hospital.avgWaitTime}분</p>
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
            onClick={() => toast(`${hospital.name}에 연락하였습니다`)}
          >
            <Phone size={16} className="mr-2" />
            병원 연락하기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
