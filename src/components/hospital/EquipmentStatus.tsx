import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { getEquipmentStatusText, getEquipmentTypeText } from "../../utils/statusHelpers";
import { getHookErrorMessage } from "../../utils/errorMessages";
import { useEquipment } from "../../hooks/useEquipment";
import type { Equipment } from "@/mocks/equipmentData";
import {
  Search,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Stethoscope,
  Activity,
  Zap,
  Monitor,
  Droplets,
  Loader2
} from 'lucide-react';

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

const getEquipmentStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'operational': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'error': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    case 'offline': return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
  }
};

const getBatteryColorClass = (level: number): string => {
  if (level > 50) return '[&>div]:bg-green-500';
  if (level >= 20) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
};

const getBatteryTextClass = (level: number): string => {
  if (level > 50) return 'text-green-600';
  if (level >= 20) return 'text-amber-600';
  return 'text-red-600';
};

export function EquipmentStatus() {
  const { equipment, loading, error, updateEquipmentStatus } = useEquipment();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    updateEquipmentStatus(equipmentId, newStatus as Equipment['status']);
    toast.success(`장비 ${equipmentId}의 상태가 ${getEquipmentStatusText(newStatus)}로 변경되었습니다.`);
  };

  const handleEmergencyAlert = (equipmentId: string) => {
    toast.error(`장비 ${equipmentId}에서 응급 알림이 발생했습니다!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {getHookErrorMessage(error)}
        </div>
      )}
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">장비 현황</h1>
          <p className="text-muted-foreground mt-1">응급실 의료 장비 상태를 실시간으로 모니터링하고 관리합니다</p>
        </div>
        <Button onClick={handleAddEquipment} className="flex items-center gap-2">
          <Plus size={16} />
          새 장비 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-slate-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <Stethoscope className="text-slate-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">전체 장비</p>
              <p className="text-2xl font-bold">{equipmentStats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-green-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">정상</p>
              <p className="text-2xl font-bold text-green-600">{equipmentStats.operational}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-amber-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <Settings className="text-amber-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">점검중</p>
              <p className="text-2xl font-bold text-amber-600">{equipmentStats.maintenance}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-red-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">오류</p>
              <p className="text-2xl font-bold text-red-600">{equipmentStats.error}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-slate-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <XCircle className="text-slate-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">오프라인</p>
              <p className="text-2xl font-bold text-slate-600">{equipmentStats.offline}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
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
      {filteredEquipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="text-sm mt-1">필터 조건을 변경해 보세요</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item) => {
          const TypeIcon = getTypeIcon(item.type);
          return (
            <Card key={item.id} className={`cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 ${
              item.status === 'error' ? 'border-l-red-500' :
              item.status === 'operational' ? 'border-l-green-500' :
              item.status === 'maintenance' ? 'border-l-amber-500' :
              'border-l-slate-400'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TypeIcon size={18} />
                    {item.name}
                  </CardTitle>
                  <Badge variant="outline" className={getEquipmentStatusBadgeClass(item.status)}>
                    {getEquipmentStatusText(item.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.id}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{getEquipmentTypeText(item.type)}</p>
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
                      <span className={`font-medium ${getBatteryTextClass(item.batteryLevel)}`}>{item.batteryLevel}%</span>
                    </div>
                    <Progress value={item.batteryLevel} className={`h-2 ${getBatteryColorClass(item.batteryLevel)}`} />
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
                  <Button variant="outline" size="sm" onClick={() => { setSelectedEquipment(item); setDialogOpen(true); }}>
                    <Settings size={14} />
                  </Button>

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
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEquipment && (
            <>
              <DialogHeader>
                <DialogTitle>장비 관리 - {selectedEquipment.name}</DialogTitle>
                <DialogDescription>장비 상태를 관리합니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* 장비 기본 정보 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">장비 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">장비 ID</Label>
                      <p className="font-medium">{selectedEquipment.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">장비명</Label>
                      <p className="font-medium">{selectedEquipment.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">제조사</Label>
                      <p className="font-medium">{selectedEquipment.manufacturer}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">모델</Label>
                      <p className="font-medium">{selectedEquipment.model}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">위치</Label>
                      <p className="font-medium">{selectedEquipment.location}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">사용 시간</Label>
                      <p className="font-medium">{selectedEquipment.usageHours}시간</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-muted-foreground text-sm">상태 변경</Label>
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

                <Separator />

                <div>
                  <Label htmlFor="notes" className="text-muted-foreground text-sm">메모</Label>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
