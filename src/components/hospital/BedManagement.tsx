import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { 
  Bed, 
  Plus, 
  Settings, 
  MapPin,
  User,
  Calendar,
  Clock
} from 'lucide-react';

interface BedInfo {
  id: string;
  section: string;
  number: string;
  status: 'occupied' | 'available' | 'maintenance' | 'cleaning';
  patient?: {
    name: string;
    id: string;
    admissionTime: string;
    diagnosis: string;
  };
  equipment: string[];
  lastCleaned: string;
  notes?: string;
}

const mockBeds: BedInfo[] = [
  {
    id: 'A-01',
    section: 'A',
    number: '01',
    status: 'occupied',
    patient: {
      name: '김민수',
      id: 'P001',
      admissionTime: '14:25',
      diagnosis: '급성 심근경색'
    },
    equipment: ['심전도', '산소공급', '링거'],
    lastCleaned: '13:30',
    notes: '중환자, 지속적인 모니터링 필요'
  },
  {
    id: 'A-02',
    section: 'A',
    number: '02',
    status: 'occupied',
    patient: {
      name: '박철수',
      id: 'P003',
      admissionTime: '12:30',
      diagnosis: '호흡곤란'
    },
    equipment: ['산소공급', '호흡기'],
    lastCleaned: '12:00',
  },
  {
    id: 'A-03',
    section: 'A',
    number: '03',
    status: 'available',
    equipment: ['기본'],
    lastCleaned: '15:00',
  },
  {
    id: 'B-01',
    section: 'B',
    number: '01',
    status: 'maintenance',
    equipment: ['기본'],
    lastCleaned: '10:00',
    notes: '전기 시설 점검 중'
  },
  {
    id: 'B-02',
    section: 'B',
    number: '02',
    status: 'cleaning',
    equipment: ['기본'],
    lastCleaned: '진행중',
  },
  {
    id: 'B-03',
    section: 'B',
    number: '03',
    status: 'occupied',
    patient: {
      name: '이영희',
      id: 'P002',
      admissionTime: '13:45',
      diagnosis: '골절 의심'
    },
    equipment: ['X-ray 호환'],
    lastCleaned: '13:15',
  },
  {
    id: 'C-01',
    section: 'C',
    number: '01',
    status: 'occupied',
    patient: {
      name: '최미영',
      id: 'P004',
      admissionTime: '11:15',
      diagnosis: '두통 및 어지러움'
    },
    equipment: ['기본'],
    lastCleaned: '11:00',
  },
  {
    id: 'C-02',
    section: 'C',
    number: '02',
    status: 'available',
    equipment: ['기본'],
    lastCleaned: '14:30',
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'occupied': return 'destructive';
    case 'available': return 'default';
    case 'maintenance': return 'secondary';
    case 'cleaning': return 'outline';
    default: return 'outline';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'occupied': return '사용중';
    case 'available': return '사용가능';
    case 'maintenance': return '점검중';
    case 'cleaning': return '청소중';
    default: return status;
  }
};

export function BedManagement() {
  const [beds] = useState<BedInfo[]>(mockBeds);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBed, setSelectedBed] = useState<BedInfo | null>(null);

  const sections = ['A', 'B', 'C'];
  
  const filteredBeds = beds.filter(bed => {
    const matchesSection = selectedSection === 'all' || bed.section === selectedSection;
    const matchesStatus = selectedStatus === 'all' || bed.status === selectedStatus;
    return matchesSection && matchesStatus;
  });

  const bedStats = {
    total: beds.length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    available: beds.filter(b => b.status === 'available').length,
    maintenance: beds.filter(b => b.status === 'maintenance').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length
  };

  const handleBedStatusChange = (bedId: string, newStatus: string) => {
    toast.success(`병상 ${bedId}의 상태가 ${getStatusText(newStatus)}로 변경되었습니다.`);
  };

  const handleAssignPatient = (bedId: string) => {
    toast.success(`병상 ${bedId}에 환자 배정 폼이 열렸습니다.`);
  };

  const handleMaintenanceRequest = (bedId: string) => {
    toast.success(`병상 ${bedId}의 유지보수가 요청되었습니다.`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>병상 관리</h1>
          <p className="text-muted-foreground">응급실 병상 현황을 실시간으로 관리합니다</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">전체 병상</p>
              <p className="text-2xl font-bold">{bedStats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">사용중</p>
              <p className="text-2xl font-bold text-red-600">{bedStats.occupied}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">사용가능</p>
              <p className="text-2xl font-bold text-green-600">{bedStats.available}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">점검중</p>
              <p className="text-2xl font-bold text-yellow-600">{bedStats.maintenance}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">청소중</p>
              <p className="text-2xl font-bold text-blue-600">{bedStats.cleaning}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="구역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 구역</SelectItem>
                {sections.map(section => (
                  <SelectItem key={section} value={section}>구역 {section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="occupied">사용중</SelectItem>
                <SelectItem value="available">사용가능</SelectItem>
                <SelectItem value="maintenance">점검중</SelectItem>
                <SelectItem value="cleaning">청소중</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 병상 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => (
          <Card key={bed.id} className={`cursor-pointer transition-all hover:shadow-md ${
            bed.status === 'occupied' ? 'border-red-200' :
            bed.status === 'available' ? 'border-green-200' :
            bed.status === 'maintenance' ? 'border-yellow-200' :
            'border-blue-200'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bed size={18} />
                  {bed.id}
                </CardTitle>
                <Badge variant={getStatusColor(bed.status) as any}>
                  {getStatusText(bed.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {bed.patient && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} />
                    <span className="font-medium">{bed.patient.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    환자 ID: {bed.patient.id}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    진단: {bed.patient.diagnosis}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock size={12} />
                    입원: {bed.patient.admissionTime}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">장비</p>
                <div className="flex flex-wrap gap-1">
                  {bed.equipment.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar size={12} />
                마지막 청소: {bed.lastCleaned}
              </div>

              {bed.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm">
                  <p>{bed.notes}</p>
                </div>
              )}

              <div className="flex gap-1 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedBed(bed)}>
                      <Settings size={14} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>병상 {bed.id} 관리</DialogTitle>
                    </DialogHeader>
                    {selectedBed && (
                      <div className="space-y-4">
                        <div>
                          <Label>상태 변경</Label>
                          <Select defaultValue={selectedBed.status} onValueChange={(value) => handleBedStatusChange(selectedBed.id, value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">사용가능</SelectItem>
                              <SelectItem value="occupied">사용중</SelectItem>
                              <SelectItem value="cleaning">청소중</SelectItem>
                              <SelectItem value="maintenance">점검중</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="notes">메모</Label>
                          <Textarea 
                            id="notes" 
                            placeholder="병상 관련 특이사항을 입력하세요..."
                            defaultValue={selectedBed.notes}
                            className="mt-2"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => handleMaintenanceRequest(selectedBed.id)}>
                            유지보수 요청
                          </Button>
                          {selectedBed.status === 'available' && (
                            <Button onClick={() => handleAssignPatient(selectedBed.id)}>
                              환자 배정
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                {bed.status === 'available' && (
                  <Button size="sm" onClick={() => handleAssignPatient(bed.id)}>
                    <Plus size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}