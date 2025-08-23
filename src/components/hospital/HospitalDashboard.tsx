import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { InfoCard } from "../common/InfoCard";
import { generateMockRequests, MockRequest } from "../common/models";
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  Check,
  Pause,
  Phone,
  Heart,
  Activity,
  Brain
} from 'lucide-react';
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function HospitalDashboard() {
  const [accepting, setAccepting] = useState(true);
  const [requests, setRequests] = useState(generateMockRequests());
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const handleAcceptingToggle = (isAccepting: boolean) => {
    setAccepting(isAccepting);
    toast(isAccepting ? "환자 수용을 시작합니다" : "환자 수용을 중단합니다");
  };

  const handleRequestAction = (requestId: string, action: 'accept' | 'hold') => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: action === 'accept' ? 'matched' : 'pending' }
        : req
    ));
    toast(action === 'accept' ? "요청을 수락했습니다" : "요청을 보류했습니다");
  };

  const filteredRequests = selectedSeverity === 'all' 
    ? requests.filter(req => req.status === 'pending')
    : requests.filter(req => req.status === 'pending' && req.severity.toString() === selectedSeverity);

  const getKPIData = () => {
    const availableBeds = 8;
    const erQueue = requests.filter(req => req.status === 'matched').length;
    const avgWaitTime = 25;
    const todayProcessed = requests.filter(req => req.status === 'completed').length;

    return { availableBeds, erQueue, avgWaitTime, todayProcessed };
  };

  const kpiData = getKPIData();

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'destructive';
    if (severity >= 3) return 'warning';
    return 'success';
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

  // 차트 데이터
  const hourlyLoadData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    patients: Math.floor(Math.random() * 15 + 5)
  }));

  const severityDistributionData = [
    { name: '경미', value: requests.filter(r => r.severity <= 2).length, color: '#10b981' },
    { name: '보통', value: requests.filter(r => r.severity === 3).length, color: '#f59e0b' },
    { name: '심각', value: requests.filter(r => r.severity >= 4).length, color: '#ef4444' },
  ];

  const recentAlerts = [
    { time: '5분 전', message: '중증 환자 3명 동시 접수', type: 'warning' },
    { time: '12분 전', message: '병상 가용률 80% 달성', type: 'info' },
    { time: '20분 전', message: '응급실 대기시간 단축', type: 'success' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary" />
            <span className="font-semibold">병원 응급실 대시보드</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${accepting ? 'text-green-600' : 'text-red-600'}`}>
              {accepting ? '환자수용중' : '수용중단'}
            </span>
            <Switch 
              checked={accepting} 
              onCheckedChange={handleAcceptingToggle}
            />
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
          icon={<Building2 size={16} />}
        />
        <InfoCard 
          title="ER 대기열" 
          value={`${kpiData.erQueue}명`} 
          subtitle="현재 대기 중"
          variant="warning"
          icon={<Users size={16} />}
        />
        <InfoCard 
          title="평균 대기시간" 
          value={`${kpiData.avgWaitTime}분`} 
          subtitle="최근 1시간 평균"
          variant="default"
          icon={<Clock size={16} />}
        />
        <InfoCard 
          title="오늘 처리" 
          value={kpiData.todayProcessed} 
          subtitle="완료된 케이스"
          variant="default"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 들어오는 요청 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  들어오는 요청
                </CardTitle>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(severity => (
                    <Button
                      key={severity}
                      size="sm"
                      variant={selectedSeverity === severity.toString() ? "default" : "outline"}
                      onClick={() => setSelectedSeverity(severity.toString())}
                    >
                      {getSeverityLabel(severity)}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={selectedSeverity === 'all' ? "default" : "outline"}
                    onClick={() => setSelectedSeverity('all')}
                  >
                    전체
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>접수시각</TableHead>
                    <TableHead>중증도</TableHead>
                    <TableHead>거리/ETA</TableHead>
                    <TableHead>증상</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.slice(0, 6).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(request.severity)}>
                          {getSeverityLabel(request.severity)} ({request.severity})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.distanceKm}km / {request.eta}분
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSymptomIcon(request.symptom)}
                          {request.symptom}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <RequestDetailDialog request={request} />
                          <Button 
                            size="sm" 
                            onClick={() => handleRequestAction(request.id, 'accept')}
                          >
                            <Check size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRequestAction(request.id, 'hold')}
                          >
                            <Pause size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-4">
          {/* 실시간 알림 */}
          <Card>
            <CardHeader>
              <CardTitle>실시간 알림</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentAlerts.map((alert, index) => (
                <div key={index} className="p-2 rounded bg-muted/50">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 중증도 분포 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>중증도 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={severityDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 시간대별 부하 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 환자 부하</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyLoadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="patients" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function RequestDetailDialog({ request }: { request: MockRequest }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
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
              연령: {request.patientAge}<br/>
              증상: {request.symptom}<br/>
              중증도: {request.severity}/5<br/>
              {request.allergies && `알레르기: ${request.allergies.join(', ')}`}
            </p>
          </div>
          <div>
            <h4 className="font-medium">위치 정보</h4>
            <p className="text-sm text-muted-foreground">
              거리: {request.distanceKm}km<br/>
              예상 도착시간: {request.eta}분
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">
              <Check size={16} className="mr-2" />
              수락
            </Button>
            <Button variant="outline" className="flex-1">
              <Phone size={16} className="mr-2" />
              연락
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}