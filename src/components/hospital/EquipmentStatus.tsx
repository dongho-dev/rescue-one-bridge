import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Stethoscope,
  Heart,
  Activity,
  Zap,
  Monitor,
  Thermometer,
  Droplets
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type: 'monitor' | 'ventilator' | 'defibrillator' | 'xray' | 'ultrasound' | 'infusion' | 'other';
  model: string;
  manufacturer: string;
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  batteryLevel?: number;
  usageHours: number;
  alerts: string[];
  assignedTo?: string;
  notes?: string;
}

const mockEquipment: Equipment[] = [
  {
    id: 'EQ001',
    name: '환자 모니터 #1',
    type: 'monitor',
    model: 'PhilipsX40',
    manufacturer: 'Philips',
    status: 'operational',
    location: '응급실 A-01',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    batteryLevel: 85,
    usageHours: 1250,
    alerts: [],
    assignedTo: '김민수 (P001)'
  },
  {
    id: 'EQ002',
    name: '인공호흡기 #1',
    type: 'ventilator',
    model: 'DrägerV500',
    manufacturer: 'Dräger',
    status: 'operational',
    location: '응급실 A-02',
    lastMaintenance: '2024-02-01',
    nextMaintenance: '2024-05-01',
    batteryLevel: 92,
    usageHours: 890,
    alerts: [],
    assignedTo: '박철수 (P003)'
  },
  {
    id: 'EQ003',
    name: '제세동기 #1',
    type: 'defibrillator',
    model: 'ZollR Plus',
    manufacturer: 'Zoll',
    status: 'maintenance',
    location: '정비실',
    lastMaintenance: '2024-02-20',
    nextMaintenance: '2024-03-20',
    batteryLevel: 100,
    usageHours: 450,
    alerts: ['정기 점검 중'],
    notes: '전극 패드 교체 예정'
  },
  {
    id: 'EQ004',
    name: 'X-ray 촬영기',
    type: 'xray',
    model: 'SiemensArios',
    manufacturer: 'Siemens',
    status: 'operational',
    location: '영상의학과',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-04-10',
    usageHours: 2150,
    alerts: []
  },
  {
    id: 'EQ005',
    name: '초음파 진단기',
    type: 'ultrasound',
    model: 'GELogiq',
    manufacturer: 'GE Healthcare',
    status: 'error',
    location: '응급실 B구역',
    lastMaintenance: '2024-01-25',
    nextMaintenance: '2024-04-25',
    usageHours: 1680,
    alerts: ['프로브 연결 오류', '긴급 수리 필요'],
    notes: '프로브 케이블 손상으로 인한 오류'
  },
  {
    id: 'EQ006',
    name: '수액 주입기 #1',
    type: 'infusion',
    model: 'B.BraunPerfusor',
    manufacturer: 'B.Braun',
    status: 'operational',
    location: '응급실 B-03',
    lastMaintenance: '2024-02-05',
    nextMaintenance: '2024-05-05',
    batteryLevel: 78,
    usageHours: 820,
    alerts: [],
    assignedTo: '이영희 (P002)'
  },
  {
    id: 'EQ007',
    name: '환자 모니터 #2',
    type: 'monitor',
    model: 'PhilipsX40',
    manufacturer: 'Philips',
    status: 'offline',
    location: '창고',
    lastMaintenance: '2024-01-20',
    nextMaintenance: '2024-04-20',
    batteryLevel: 0,
    usageHours: 2890,
    alerts: ['배터리 방전', '전원 공급 필요'],
    notes: '예비 장비로 보관 중'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational': return 'default';
    case 'maintenance': return 'secondary';
    case 'error': return 'destructive';
    case 'offline': return 'outline';
    default: return 'outline';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'operational': return '정상';
    case 'maintenance': return '점검중';
    case 'error': return '오류';
    case 'offline': return '오프라인';
    default: return status;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'monitor': return Monitor;
    case 'ventilator': return Activity;
    case 'defibrillator': return Zap;
    case 'xray': return Activity;
    case 'ultrasound': return Activity;
    case 'infusion': return Droplets;
    default: return Stethoscope;
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case 'monitor': return '환자 모니터';
    case 'ventilator': return '인공호흡기';
    case 'defibrillator': return '제세동기';
    case 'xray': return 'X-ray';
    case 'ultrasound': return '초음파';
    case 'infusion': return '수액 주입기';
    default: return '기타';
  }
};

export function EquipmentStatus() {
  const [equipment] = useState<Equipment[]>(mockEquipment);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const equipmentStats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === 'operational').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    error: equipment.filter(e => e.status === 'error').length,
    offline: equipment.filter(e => e.status === 'offline').length
  };

  const handleAddEquipment = () => {
    toast.success("새 장비 등록 폼이 열렸습니다.");
  };

  const handleMaintenanceRequest = (equipmentId: string) => {
    toast.success(`장비 ${equipmentId}의 유지보수가 요청되었습니다.`);
  };

  const handleStatusChange = (equipmentId: string, newStatus: string) => {
    toast.success(`장비 ${equipmentId}의 상태가 ${getStatusText(newStatus)}로 변경되었습니다.`);
  };

  const handleEmergencyAlert = (equipmentId: string) => {
    toast.error(`장비 ${equipmentId}에서 응급 알림이 발생했습니다!`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>장비 현황</h1>
          <p className="text-muted-foreground">응급실 의료 장비 상태를 실시간으로 모니터링합니다</p>
        </div>
        <Button onClick={handleAddEquipment} className="flex items-center gap-2">
          <Plus size={16} />
          새 장비 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Stethoscope className="mx-auto mb-2 text-muted-foreground" size={20} />
              <p className="text-sm text-muted-foreground">전체 장비</p>
              <p className="text-2xl font-bold">{equipmentStats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={20} />
              <p className="text-sm text-muted-foreground">정상</p>
              <p className="text-2xl font-bold text-green-600">{equipmentStats.operational}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Settings className="mx-auto mb-2 text-yellow-600" size={20} />
              <p className="text-sm text-muted-foreground">점검중</p>
              <p className="text-2xl font-bold text-yellow-600">{equipmentStats.maintenance}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-2 text-red-600" size={20} />
              <p className="text-sm text-muted-foreground">오류</p>
              <p className="text-2xl font-bold text-red-600">{equipmentStats.error}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <XCircle className="mx-auto mb-2 text-gray-600" size={20} />
              <p className="text-sm text-muted-foreground">오프라인</p>
              <p className="text-2xl font-bold text-gray-600">{equipmentStats.offline}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="장비명, ID, 모델명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="장비 종류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 종류</SelectItem>
                <SelectItem value="monitor">환자 모니터</SelectItem>
                <SelectItem value="ventilator">인공호흡기</SelectItem>
                <SelectItem value="defibrillator">제세동기</SelectItem>
                <SelectItem value="xray">X-ray</SelectItem>
                <SelectItem value="ultrasound">초음파</SelectItem>
                <SelectItem value="infusion">수액 주입기</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="operational">정상</SelectItem>
                <SelectItem value="maintenance">점검중</SelectItem>
                <SelectItem value="error">오류</SelectItem>
                <SelectItem value="offline">오프라인</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 장비 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item) => {
          const TypeIcon = getTypeIcon(item.type);
          return (
            <Card key={item.id} className={`cursor-pointer transition-all hover:shadow-md ${
              item.status === 'error' ? 'border-red-200' :
              item.status === 'operational' ? 'border-green-200' :
              item.status === 'maintenance' ? 'border-yellow-200' :
              'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TypeIcon size={18} />
                    {item.name}
                  </CardTitle>
                  <Badge variant={getStatusColor(item.status) as any}>
                    {getStatusText(item.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.id}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{getTypeText(item.type)}</p>
                  <p className="text-sm text-muted-foreground">{item.manufacturer} {item.model}</p>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={12} />
                  {item.location}
                </div>

                {item.assignedTo && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm">
                    <p className="font-medium">사용 중: {item.assignedTo}</p>
                  </div>
                )}

                {item.batteryLevel !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>배터리</span>
                      <span>{item.batteryLevel}%</span>
                    </div>
                    <Progress value={item.batteryLevel} className="h-2" />
                  </div>
                )}

                <div className="text-sm">
                  <p className="text-muted-foreground">사용 시간: {item.usageHours}h</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar size={12} />
                    다음 점검: {item.nextMaintenance}
                  </div>
                </div>

                {item.alerts.length > 0 && (
                  <div className="space-y-1">
                    {item.alerts.map((alert, index) => (
                      <div key={index} className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm">
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} className="text-red-600" />
                          <span className="text-red-600">{alert}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm">
                    <p>{item.notes}</p>
                  </div>
                )}

                <div className="flex gap-1 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedEquipment(item)}>
                        <Settings size={14} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>장비 관리 - {item.name}</DialogTitle>
                      </DialogHeader>
                      {selectedEquipment && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>장비 ID</Label>
                              <p>{selectedEquipment.id}</p>
                            </div>
                            <div>
                              <Label>장비명</Label>
                              <p>{selectedEquipment.name}</p>
                            </div>
                            <div>
                              <Label>제조사</Label>
                              <p>{selectedEquipment.manufacturer}</p>
                            </div>
                            <div>
                              <Label>모델</Label>
                              <p>{selectedEquipment.model}</p>
                            </div>
                            <div>
                              <Label>위치</Label>
                              <p>{selectedEquipment.location}</p>
                            </div>
                            <div>
                              <Label>사용 시간</Label>
                              <p>{selectedEquipment.usageHours}시간</p>
                            </div>
                          </div>

                          <div>
                            <Label>상태 변경</Label>
                            <Select defaultValue={selectedEquipment.status} onValueChange={(value) => handleStatusChange(selectedEquipment.id, value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="operational">정상</SelectItem>
                                <SelectItem value="maintenance">점검중</SelectItem>
                                <SelectItem value="error">오류</SelectItem>
                                <SelectItem value="offline">오프라인</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="notes">메모</Label>
                            <Textarea 
                              id="notes" 
                              placeholder="장비 관련 특이사항을 입력하세요..."
                              defaultValue={selectedEquipment.notes}
                              className="mt-2"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleMaintenanceRequest(selectedEquipment.id)}>
                              유지보수 요청
                            </Button>
                            <Button variant="destructive" onClick={() => handleEmergencyAlert(selectedEquipment.id)}>
                              긴급 알림
                            </Button>
                            <Button onClick={() => toast.success("장비 정보가 저장되었습니다.")}>
                              저장
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {item.status === 'error' && (
                    <Button size="sm" variant="destructive" onClick={() => handleEmergencyAlert(item.id)}>
                      <AlertTriangle size={14} />
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline" onClick={() => handleMaintenanceRequest(item.id)}>
                    <Calendar size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}