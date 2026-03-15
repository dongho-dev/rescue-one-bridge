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
import { toast } from "sonner";
import { getSeverityColor, getSeverityText, getPatientStatusColor, getPatientStatusText } from "../../utils/statusHelpers";
import { mockPatients, type Patient } from "@/mocks/patientData";
import {
  Search,
  Plus,
  Eye,
  Edit,
  UserPlus,
  Clock,
  Heart,
  Thermometer,
  Droplets,
  Activity,
  Users
} from 'lucide-react';


export function PatientDetails() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
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
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: newStatus as Patient['status'] } : p));
    toast.success(`환자 ${patientId}의 상태가 ${newStatus}로 업데이트되었습니다.`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">환자 관리</h1>
          <p className="text-muted-foreground">응급실 내 환자 정보를 관리합니다</p>
        </div>
        <Button onClick={handleAddPatient} className="flex items-center gap-2">
          <UserPlus size={16} />
          새 환자 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            현재 환자 목록 ({filteredPatients.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableRow key={patient.id}>
                      <TableCell>{patient.id}</TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.age}세 / {patient.gender}</TableCell>
                      <TableCell>{patient.diagnosis}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(patient.severity)}>
                          {getSeverityText(patient.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Clock size={14} />
                        {patient.admissionTime}
                      </TableCell>
                      <TableCell>{patient.bed}</TableCell>
                      <TableCell>
                        <Badge variant={getPatientStatusColor(patient.status)}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>환자 ID</Label>
                    <p>{selectedPatient.id}</p>
                  </div>
                  <div>
                    <Label>이름</Label>
                    <p>{selectedPatient.name}</p>
                  </div>
                  <div>
                    <Label>나이</Label>
                    <p>{selectedPatient.age}세</p>
                  </div>
                  <div>
                    <Label>성별</Label>
                    <p>{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <Label>진단</Label>
                    <p>{selectedPatient.diagnosis}</p>
                  </div>
                  <div>
                    <Label>배정 병상</Label>
                    <p>{selectedPatient.bed}</p>
                  </div>
                </div>

                {/* 바이탈 사인 */}
                <div>
                  <h4 className="mb-3">바이탈 사인</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Heart className="text-red-500" size={16} />
                          <span className="text-sm">심박수</span>
                        </div>
                        <p className="mt-1">{selectedPatient.vitals.heartRate} bpm</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Activity className="text-blue-500" size={16} />
                          <span className="text-sm">혈압</span>
                        </div>
                        <p className="mt-1">{selectedPatient.vitals.bloodPressure} mmHg</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Thermometer className="text-orange-500" size={16} />
                          <span className="text-sm">체온</span>
                        </div>
                        <p className="mt-1">{selectedPatient.vitals.temperature}°C</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Droplets className="text-green-500" size={16} />
                          <span className="text-sm">산소포화도</span>
                        </div>
                        <p className="mt-1">{selectedPatient.vitals.oxygenSaturation}%</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 메모 */}
                <div>
                  <Label htmlFor="notes">진료 메모</Label>
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