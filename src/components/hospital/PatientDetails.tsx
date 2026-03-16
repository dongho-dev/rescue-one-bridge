import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { getSeverityText, getPatientStatusText } from "../../utils/statusHelpers";
import { usePatients } from "../../hooks/usePatients";
import type { Patient } from "@/mocks/patientData";
import {
  Search,
  UserPlus,
  Eye,
  Edit,
  Clock,
  Heart,
  Thermometer,
  Droplets,
  Activity,
  Users,
  Loader2
} from 'lucide-react';


const getSeverityBadgeClass = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    case 'urgent': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'stable': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
  }
};

const getPatientStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'treating': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    case 'waiting': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'stable': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    case 'discharged': return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
  }
};

export function PatientDetails() {
  const { patients, loading, error, updatePatientStatus } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || patient.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleAddPatient = () => {
    toast.success("새 환자 등록 폼이 열렸습니다.");
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleUpdateStatus = (patientId: string, newStatus: string) => {
    updatePatientStatus(patientId, newStatus as Patient['status']);
    toast.success(`환자 ${patientId}의 상태가 ${newStatus}로 업데이트되었습니다.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (error) {
    toast.error(error);
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">환자 관리</h1>
          <p className="text-muted-foreground mt-1">응급실 내 환자 정보를 조회하고 상태를 관리합니다</p>
        </div>
        <Button onClick={handleAddPatient} className="flex items-center gap-2">
          <UserPlus size={16} />
          새 환자 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="환자명, ID, 진단명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="중증도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 중증도</SelectItem>
                <SelectItem value="critical">위급</SelectItem>
                <SelectItem value="urgent">응급</SelectItem>
                <SelectItem value="stable">안정</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="waiting">대기중</SelectItem>
                <SelectItem value="treating">치료중</SelectItem>
                <SelectItem value="stable">안정</SelectItem>
                <SelectItem value="discharged">퇴원</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 환자 목록 */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Users size={20} className="text-primary" />
            </div>
            현재 환자 목록 ({filteredPatients.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>환자 ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>나이/성별</TableHead>
                  <TableHead>진단</TableHead>
                  <TableHead>중증도</TableHead>
                  <TableHead>입원시간</TableHead>
                  <TableHead>병상</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p className="text-lg font-medium">검색 결과가 없습니다</p>
                        <p className="text-sm mt-1">필터 조건을 변경해 보세요</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{patient.id}</TableCell>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.age}세 / {patient.gender}</TableCell>
                      <TableCell>{patient.diagnosis}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSeverityBadgeClass(patient.severity)}>
                          {getSeverityText(patient.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={14} />
                          {patient.admissionTime}
                        </div>
                      </TableCell>
                      <TableCell>{patient.bed}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPatientStatusBadgeClass(patient.status)}>
                          {getPatientStatusText(patient.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { handleViewDetails(patient); setDialogOpen(true); }} aria-label="상세보기">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toast.success("환자 정보 수정 폼이 열렸습니다.")}>
                            <Edit size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle>환자 상세 정보 - {selectedPatient.name}</DialogTitle>
                <DialogDescription>환자 상세 정보입니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">환자 ID</Label>
                      <p className="font-medium">{selectedPatient.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">이름</Label>
                      <p className="font-medium">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">나이</Label>
                      <p className="font-medium">{selectedPatient.age}세</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">성별</Label>
                      <p className="font-medium">{selectedPatient.gender}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">진단</Label>
                      <p className="font-medium">{selectedPatient.diagnosis}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">배정 병상</Label>
                      <p className="font-medium">{selectedPatient.bed}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 바이탈 사인 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">바이탈 사인</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-red-100">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-red-500/10 rounded-full p-2">
                            <Heart className="text-red-500" size={16} />
                          </div>
                          <span className="text-sm text-muted-foreground">심박수</span>
                        </div>
                        <p className="text-lg font-semibold text-red-600">{selectedPatient.vitals.heartRate} <span className="text-sm font-normal text-muted-foreground">bpm</span></p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-blue-100">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-blue-500/10 rounded-full p-2">
                            <Activity className="text-blue-500" size={16} />
                          </div>
                          <span className="text-sm text-muted-foreground">혈압</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-600">{selectedPatient.vitals.bloodPressure} <span className="text-sm font-normal text-muted-foreground">mmHg</span></p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-orange-100">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-orange-500/10 rounded-full p-2">
                            <Thermometer className="text-orange-500" size={16} />
                          </div>
                          <span className="text-sm text-muted-foreground">체온</span>
                        </div>
                        <p className="text-lg font-semibold text-orange-600">{selectedPatient.vitals.temperature}<span className="text-sm font-normal text-muted-foreground">°C</span></p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-green-100">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-green-500/10 rounded-full p-2">
                            <Droplets className="text-green-500" size={16} />
                          </div>
                          <span className="text-sm text-muted-foreground">산소포화도</span>
                        </div>
                        <p className="text-lg font-semibold text-green-600">{selectedPatient.vitals.oxygenSaturation}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* 메모 */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">진료 메모</Label>
                  <Textarea
                    id="notes"
                    placeholder="환자 상태, 치료 계획 등을 기록하세요..."
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => toast.success("환자 정보가 저장되었습니다.")}>
                    저장
                  </Button>
                  <Button onClick={() => handleUpdateStatus(selectedPatient.id, "updated")}>
                    상태 업데이트
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
