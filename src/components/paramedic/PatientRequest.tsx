import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { getSeverityColor, getSeverityText } from "../../utils/statusHelpers";
import { useRequests } from "@/hooks/useRequests";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { RequestPriority } from "@/types/database";
import {
  Ambulance,
  User,
  MapPin,
  Clock,
  Phone,
  AlertTriangle,
  Heart,
  Activity,
  Thermometer,
  Plus,
  Send,
  Navigation,
  Timer,
  Users
} from 'lucide-react';

interface QuickPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  severity: 'critical' | 'urgent' | 'stable';
  lastUsed: string;
}

const quickPatients: QuickPatient[] = [
  {
    id: 'QP001',
    name: '김철수',
    age: 45,
    gender: '남성',
    condition: '심장 관련',
    severity: 'critical',
    lastUsed: '2024-02-20'
  },
  {
    id: 'QP002',
    name: '이영희',
    age: 32,
    gender: '여성',
    condition: '외상',
    severity: 'urgent',
    lastUsed: '2024-02-19'
  },
  {
    id: 'QP003',
    name: '박민수',
    age: 67,
    gender: '남성',
    condition: '호흡곤란',
    severity: 'urgent',
    lastUsed: '2024-02-18'
  }
];


export function PatientRequest() {
  const { createRequest } = useRequests();
  const { position, refresh: refreshGeo } = useGeolocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('위치 확인 중...');
  const [estimatedTime] = useState('15분');

  // GPS 좌표 → 주소 텍스트 (reverse geocoding via Nominatim)
  useEffect(() => {
    if (!position) return;
    const { latitude, longitude } = position;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ko`)
      .then(r => r.json())
      .then(data => {
        if (data.display_name) {
          const parts = data.display_name.split(', ').slice(0, 3);
          setCurrentLocation(parts.reverse().join(' '));
        }
      })
      .catch(() => setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`));
  }, [position]);

  // 새 환자 폼 상태
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: '',
    condition: '',
    severity: '',
    symptoms: '',
    vitals: {
      consciousness: '',
      bloodPressure: '',
      pulse: '',
      respiration: '',
      temperature: ''
    }
  });

  const handleQuickSelect = (patient: QuickPatient) => {
    setSelectedPatient(patient);
    setIsNewPatient(false);
    toast.success(`${patient.name} 환자가 선택되었습니다.`);
  };

  const handleNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    toast.info("새 환자 정보를 입력해주세요.");
  };

  const handleLocationUpdate = () => {
    refreshGeo();
    toast.success("현재 위치가 업데이트되었습니다.");
  };

  const handleRequest = async (type: 'emergency' | 'urgent' | 'normal') => {
    if (isSubmitting) return;

    if (!selectedPatient && !isNewPatient) {
      toast.error("환자를 선택하거나 새 환자 정보를 입력해주세요.");
      return;
    }

    if (isNewPatient) {
      if (!newPatientForm.name.trim()) {
        toast.error("환자 이름을 입력해주세요.");
        return;
      }
      if (!newPatientForm.age.trim()) {
        toast.error("환자 나이를 입력해주세요.");
        return;
      }
      const ageNum = parseInt(newPatientForm.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        toast.error("나이는 0~150 사이의 숫자여야 합니다.");
        return;
      }
      if (!newPatientForm.severity) {
        toast.error("중증도를 선택해주세요.");
        return;
      }
      if (!newPatientForm.condition.trim()) {
        toast.error("주요 증상을 입력해주세요.");
        return;
      }
    }

    const severityMap: Record<string, number> = { critical: 5, urgent: 3, stable: 1 };
    const patientSeverity = selectedPatient
      ? severityMap[selectedPatient.severity] ?? 3
      : severityMap[newPatientForm.severity] ?? 3;

    setIsSubmitting(true);
    try {
      await createRequest({
        priority: type as RequestPriority,
        severity: patientSeverity,
        symptom: selectedPatient ? selectedPatient.condition : newPatientForm.condition,
        patient_name: selectedPatient ? selectedPatient.name : newPatientForm.name || undefined,
        patient_age: selectedPatient ? selectedPatient.age : (Number(newPatientForm.age) || undefined),
        patient_gender: selectedPatient ? selectedPatient.gender : (newPatientForm.gender || undefined),
        vitals: isNewPatient ? {
          blood_pressure: newPatientForm.vitals.bloodPressure || undefined,
          heart_rate: Number(newPatientForm.vitals.pulse) || undefined,
          temperature: Number(newPatientForm.vitals.temperature) || undefined,
        } : undefined,
        notes: isNewPatient ? newPatientForm.symptoms || undefined : undefined,
        location_text: currentLocation,
        latitude: position?.latitude ?? undefined,
        longitude: position?.longitude ?? undefined,
      });

      // Reset form on success
      setSelectedPatient(null);
      setIsNewPatient(false);
      setNewPatientForm({
        name: '', age: '', gender: '', condition: '', severity: '', symptoms: '',
        vitals: { consciousness: '', bloodPressure: '', pulse: '', respiration: '', temperature: '' }
      });
    } catch {
      // Error already handled by the hook via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
            <Ambulance size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">구급대원 환자 요청</h1>
            <p className="text-sm text-muted-foreground">환자 정보를 선택하고 병원에 요청하세요</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Timer size={14} />
          {estimatedTime} 도착 예정
        </Badge>
      </div>

      {/* 위치/ETA 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MapPin className="text-blue-600 dark:text-blue-400" size={16} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">현재 위치</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLocationUpdate} className="h-8">
                <Navigation size={14} className="mr-1" />
                위치 업데이트
              </Button>
            </div>
            <p className="mt-2.5 text-sm font-medium pl-9">{currentLocation}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Clock className="text-amber-600 dark:text-amber-400" size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">예상 도착 시간</span>
            </div>
            <p className="mt-2.5 text-2xl font-bold pl-9 text-amber-700 dark:text-amber-400">{estimatedTime}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 환자 선택 */}
        <div className="space-y-4">
          {/* 빠른 선택 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users size={18} />
                빠른 환자 선택
              </CardTitle>
              <p className="text-xs text-muted-foreground">최근 환자 중 선택하거나 새로 등록하세요</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
                    selectedPatient?.id === patient.id
                      ? 'ring-2 ring-primary shadow-md bg-primary/5'
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => handleQuickSelect(patient)}
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full ${
                          selectedPatient?.id === patient.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <User size={14} />
                        </div>
                        <span className="font-medium">{patient.name}</span>
                      </div>
                      <Badge variant={getSeverityColor(patient.severity)}>
                        {getSeverityText(patient.severity)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 pl-7">
                      <p>{patient.age}세 / {patient.gender}</p>
                      <p>증상: {patient.condition}</p>
                      <p className="flex items-center gap-1 text-xs">
                        <Clock size={11} />
                        최근 사용: {patient.lastUsed}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Separator className="my-2" />

              <Button
                variant={isNewPatient ? "default" : "outline"}
                className="w-full"
                onClick={handleNewPatient}
              >
                <Plus size={16} className="mr-2" />
                새 환자 등록
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 환자 정보 및 요청 */}
        <div className="space-y-4">
          {selectedPatient && !isNewPatient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User size={18} />
                  선택된 환자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">이름</Label>
                    <p className="font-medium">{selectedPatient.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">나이/성별</Label>
                    <p className="font-medium">{selectedPatient.age}세 / {selectedPatient.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">증상</Label>
                    <p className="font-medium">{selectedPatient.condition}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">중증도</Label>
                    <div>
                      <Badge variant={getSeverityColor(selectedPatient.severity)}>
                        {getSeverityText(selectedPatient.severity)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="additional-notes" className="text-sm font-medium text-muted-foreground">추가 정보</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="환자 상태, 현장 상황 등 추가 정보를 입력하세요..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isNewPatient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus size={18} />
                  새 환자 정보 입력
                </CardTitle>
                <p className="text-xs text-muted-foreground">필수 항목을 입력해주세요</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">환자명 *</Label>
                    <Input
                      id="name"
                      placeholder="이름을 입력하세요"
                      value={newPatientForm.name}
                      onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-sm font-medium text-muted-foreground">나이 *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="나이"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm({...newPatientForm, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">성별</Label>
                    <Select value={newPatientForm.gender} onValueChange={(value) => setNewPatientForm({...newPatientForm, gender: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="성별 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">남성</SelectItem>
                        <SelectItem value="female">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">중증도 *</Label>
                    <Select value={newPatientForm.severity} onValueChange={(value) => setNewPatientForm({...newPatientForm, severity: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="중증도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">위급</SelectItem>
                        <SelectItem value="urgent">응급</SelectItem>
                        <SelectItem value="stable">안정</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="condition" className="text-sm font-medium text-muted-foreground">주요 증상 *</Label>
                  <Input
                    id="condition"
                    placeholder="주요 증상을 입력하세요"
                    value={newPatientForm.condition}
                    onChange={(e) => setNewPatientForm({...newPatientForm, condition: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="symptoms" className="text-sm font-medium text-muted-foreground">상세 증상</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="환자의 상세한 증상과 현장 상황을 기록하세요..."
                    value={newPatientForm.symptoms}
                    onChange={(e) => setNewPatientForm({...newPatientForm, symptoms: e.target.value})}
                  />
                </div>

                <Separator />

                {/* 바이탈 사인 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-muted-foreground" />
                    <Label className="text-sm font-medium text-muted-foreground">바이탈 사인 (선택사항)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="consciousness" className="text-xs font-medium text-muted-foreground">의식 상태</Label>
                      <Input
                        id="consciousness"
                        placeholder="명료/혼미/혼수 등"
                        value={newPatientForm.vitals.consciousness}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm,
                          vitals: {...newPatientForm.vitals, consciousness: e.target.value}
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bloodPressure" className="text-xs font-medium text-muted-foreground">혈압</Label>
                      <Input
                        id="bloodPressure"
                        placeholder="120/80"
                        value={newPatientForm.vitals.bloodPressure}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm,
                          vitals: {...newPatientForm.vitals, bloodPressure: e.target.value}
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pulse" className="text-xs font-medium text-muted-foreground">맥박</Label>
                      <Input
                        id="pulse"
                        placeholder="80 bpm"
                        value={newPatientForm.vitals.pulse}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm,
                          vitals: {...newPatientForm.vitals, pulse: e.target.value}
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="respiration" className="text-xs font-medium text-muted-foreground">호흡</Label>
                      <Input
                        id="respiration"
                        placeholder="20 /min"
                        value={newPatientForm.vitals.respiration}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm,
                          vitals: {...newPatientForm.vitals, respiration: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 요청 버튼 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Send size={18} />
                병원 요청
              </CardTitle>
              <p className="text-xs text-muted-foreground">환자 상태에 따라 요청 유형을 선택하세요</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white text-base font-semibold h-14 shadow-lg shadow-red-600/20"
                onClick={() => handleRequest('emergency')}
                disabled={isSubmitting}
              >
                <AlertTriangle size={20} className="mr-2" />
                {isSubmitting ? '전송 중...' : '응급 요청 (위급)'}
              </Button>

              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-12"
                onClick={() => handleRequest('urgent')}
                disabled={isSubmitting}
              >
                <Heart size={18} className="mr-2" />
                {isSubmitting ? '전송 중...' : '응급 요청 (긴급)'}
              </Button>

              <Button
                variant="outline"
                className="w-full border-2 border-primary text-primary hover:bg-primary/10 font-medium h-11"
                onClick={() => handleRequest('normal')}
                disabled={isSubmitting}
              >
                <Activity size={16} className="mr-2" />
                {isSubmitting ? '전송 중...' : '일반 이송 요청'}
              </Button>

              <Separator className="my-1" />

              <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
                <Phone size={14} className="mr-2" />
                병원과 직접 통화
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
