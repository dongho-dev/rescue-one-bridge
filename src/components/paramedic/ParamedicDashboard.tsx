import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { InfoCard, StatChip } from "../common/InfoCard";
import { MiniMapPlaceholder } from "../common/MiniMapPlaceholder";
import { generateMockRequests, generateMockHospitals, MockHospital } from "../common/models";
import { 
  Ambulance, 
  Phone, 
  Share2, 
  Heart, 
  Brain, 
  Activity,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { toast } from "sonner";

export function ResponderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
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

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'destructive';
    if (severity >= 3) return 'warning';
    return 'success';
  };

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case '심장내과': return <Heart size={16} />;
      case '신경외과': return <Brain size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const recentEvents = [
    { time: '10분 전', message: '서울대병원 수용 가능 상태 전환', type: 'info' },
    { time: '15분 전', message: 'Case #RQ-1023 배정 완료', type: 'success' },
    { time: '23분 전', message: '응급호출 3건 신규 접수', type: 'warning' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Ambulance className="text-primary" />
            <span className="font-semibold">구급대원 대시보드</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? '온라인' : '오프라인'}
            </span>
            <Switch 
              checked={isOnline} 
              onCheckedChange={handleStatusToggle}
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
          <CardContent className="space-y-4">
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
        <CardContent>
          <div className="space-y-2">
            {recentEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">{event.message}</span>
                <span className="text-xs text-muted-foreground">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HospitalCard({ hospital }: { hospital: MockHospital }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">{hospital.name}</h4>
            <Badge variant={hospital.accepting ? "default" : "destructive"}>
              {hospital.accepting ? "수용가능" : "수용불가"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{hospital.distanceKm}km</span>
            <span>대기: {hospital.queue}명</span>
            <span>병상: {hospital.beds}개</span>
          </div>
          <div className="flex gap-1 mt-2">
            {hospital.specialties.slice(0, 3).map((specialty, i) => (
              <StatChip key={i} label={specialty} value={0} size="sm" />
            ))}
          </div>
        </div>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{hospital.name}</SheetTitle>
          <SheetDescription>병원 상세 정보</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-medium">수용 상태</p>
            <Badge variant={hospital.accepting ? "default" : "destructive"} className="mt-1">
              {hospital.accepting ? "수용 가능" : "수용 불가"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">거리 및 대기 정보</p>
            <p className="text-sm text-muted-foreground mt-1">
              거리: {hospital.distanceKm}km<br/>
              ER 대기: {hospital.queue}명<br/>
              가용 병상: {hospital.beds}개<br/>
              평균 대기시간: {hospital.avgWaitTime}분
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">전문 진료과</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {hospital.specialties.map((specialty, i) => (
                <Badge key={i} variant="outline">{specialty}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">연락처</p>
            <p className="text-sm text-muted-foreground mt-1">{hospital.contact}</p>
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