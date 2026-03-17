import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { toast } from "sonner";
import { getBedStatusText } from "../../utils/statusHelpers";
import { useBeds } from "@/hooks/useBeds";
import { usePatients } from "@/hooks/usePatients";
import type { Bed as BedType, BedStatus } from "@/types/database";
import {
  Bed,
  Plus,
  Settings,
  User,
  Calendar,
  Clock
} from 'lucide-react';


const getBedStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'occupied': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    case 'available': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'cleaning': return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
  }
};

export function BedManagement() {
  const { beds, updateBedStatus } = useBeds();
  const { patients: allPatients } = usePatients();
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBed, setSelectedBed] = useState<BedType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const occupancyRate = bedStats.total > 0 ? Math.round((bedStats.occupied / bedStats.total) * 100) : 0;

  const handleBedStatusChange = (bedId: string, newStatus: string) => {
    const status = newStatus as BedStatus;
    updateBedStatus(bedId, status);
    toast.success(`병상 ${bedId}의 상태가 ${getBedStatusText(status)}로 변경되었습니다.`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">병상 관리</h1>
          <p className="text-muted-foreground mt-1">응급실 병상 현황을 실시간으로 관리하고 배정 상태를 확인합니다</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-slate-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <Bed className="text-slate-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">전체 병상</p>
              <p className="text-2xl font-bold">{bedStats.total}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>사용률</span>
                  <span>{occupancyRate}%</span>
                </div>
                <Progress value={occupancyRate} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-red-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <User className="text-red-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">사용중</p>
              <p className="text-2xl font-bold text-red-600">{bedStats.occupied}</p>
              <div className="mt-2">
                <Progress value={bedStats.total > 0 ? (bedStats.occupied / bedStats.total) * 100 : 0} className="h-1.5 [&>div]:bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-green-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <Plus className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">사용가능</p>
              <p className="text-2xl font-bold text-green-600">{bedStats.available}</p>
              <div className="mt-2">
                <Progress value={bedStats.total > 0 ? (bedStats.available / bedStats.total) * 100 : 0} className="h-1.5 [&>div]:bg-green-500" />
              </div>
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
              <p className="text-2xl font-bold text-amber-600">{bedStats.maintenance}</p>
              <div className="mt-2">
                <Progress value={bedStats.total > 0 ? (bedStats.maintenance / bedStats.total) * 100 : 0} className="h-1.5 [&>div]:bg-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="bg-blue-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                <Clock className="text-blue-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground">청소중</p>
              <p className="text-2xl font-bold text-blue-600">{bedStats.cleaning}</p>
              <div className="mt-2">
                <Progress value={bedStats.total > 0 ? (bedStats.cleaning / bedStats.total) * 100 : 0} className="h-1.5 [&>div]:bg-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-3">
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
      {filteredBeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="text-sm mt-1">필터 조건을 변경해 보세요</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => (
          <Card key={bed.id} className={`cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 ${
            bed.status === 'occupied' ? 'border-l-red-500' :
            bed.status === 'available' ? 'border-l-green-500' :
            bed.status === 'maintenance' ? 'border-l-amber-500' :
            'border-l-blue-500'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bed size={18} />
                  {bed.id}
                </CardTitle>
                <Badge variant="outline" className={getBedStatusBadgeClass(bed.status)}>
                  {getBedStatusText(bed.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {bed.status === 'occupied' && (() => {
                const patient = allPatients.find(p => p.bed_id === bed.id);
                return patient ? (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} />
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      환자 ID: {patient.id}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      진단: {patient.diagnosis ?? '-'}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock size={12} />
                      입원: {new Date(patient.admission_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : null;
              })()}

              {bed.last_cleaned && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar size={12} />
                  마지막 청소: {new Date(bed.last_cleaned).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {bed.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm">
                  <p>{bed.notes}</p>
                </div>
              )}

              <div className="flex gap-1 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedBed(bed); setDialogOpen(true); }}>
                  <Settings size={14} />
                </Button>

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
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedBed && (
            <>
              <DialogHeader>
                <DialogTitle>병상 {selectedBed.id} 관리</DialogTitle>
                <DialogDescription>병상 상태를 관리합니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">상태 변경</Label>
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

                <Separator />

                <div>
                  <Label htmlFor="notes" className="text-muted-foreground text-sm">메모</Label>
                  <Textarea
                    id="notes"
                    placeholder="병상 관련 특이사항을 입력하세요..."
                    defaultValue={selectedBed.notes ?? ''}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
