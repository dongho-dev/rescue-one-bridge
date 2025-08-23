import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'urgent': return 'secondary';
    case 'stable': return 'outline';
    default: return 'outline';
  }
};

const getSeverityText = (severity: string) => {
  switch (severity) {
    case 'critical': return '위급';
    case 'urgent': return '응급';
    case 'stable': return '안정';
    default: return severity;
  }
};

export function PatientRequest() {
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('서울시 강남구 역삼동 123-45');
  const [estimatedTime, setEstimatedTime] = useState('15분');

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
    toast.success("현재 위치가 업데이트되었습니다.");
  };

  const handleEmergencyRequest = () => {
    if (!selectedPatient && !isNewPatient) {
      toast.error("환자를 선택하거나 새 환자 정보를 입력해주세요.");
      return;
    }
    
    const patientName = selectedPatient ? selectedPatient.name : newPatientForm.name;
    toast.success(`${patientName} 환자의 응급 요청이 병원으로 전송되었습니다!`);
  };

  const handleUrgentRequest = () => {
    if (!selectedPatient && !isNewPatient) {
      toast.error("환자를 선택하거나 새 환자 정보를 입력해주세요.");
      return;
    }
    
    const patientName = selectedPatient ? selectedPatient.name : newPatientForm.name;
    toast.success(`${patientName} 환자의 응급 요청이 병원으로 전송되었습니다!`);
  };

  const handleNormalRequest = () => {
    if (!selectedPatient && !isNewPatient) {
      toast.error("환자를 선택하거나 새 환자 정보를 입력해주세요.");
      return;
    }
    
    const patientName = selectedPatient ? selectedPatient.name : newPatientForm.name;
    toast.success(`${patientName} 환자의 이송 요청이 병원으로 전송되었습니다.`);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Ambulance size={24} />
          </div>
          <div>
            <h1>구급대원 환자 요청</h1>
            <p className="text-muted-foreground">환자 정보를 선택하고 병원에 요청하세요</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Timer size={14} />
          {estimatedTime} 도착 예정
        </Badge>
      </div>

      {/* 위치 정보 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-600" size={16} />
              <span className="text-sm font-medium">현재 위치</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLocationUpdate}>
              <Navigation size={14} className="mr-1" />
              위치 업데이트
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{currentLocation}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 환자 선택 */}
        <div className="space-y-4">
          {/* 빠른 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} />
                빠른 환자 선택
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPatient?.id === patient.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleQuickSelect(patient)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span className="font-medium">{patient.name}</span>
                      </div>
                      <Badge variant={getSeverityColor(patient.severity) as any}>
                        {getSeverityText(patient.severity)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{patient.age}세 / {patient.gender}</p>
                      <p>증상: {patient.condition}</p>
                      <p className="flex items-center gap-1">
                        <Clock size={12} />
                        최근 사용: {patient.lastUsed}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                variant="outline" 
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={18} />
                  선택된 환자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>이름</Label>
                    <p className="mt-1">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <Label>나이/성별</Label>
                    <p className="mt-1">{selectedPatient.age}세 / {selectedPatient.gender}</p>
                  </div>
                  <div>
                    <Label>증상</Label>
                    <p className="mt-1">{selectedPatient.condition}</p>
                  </div>
                  <div>
                    <Label>중증도</Label>
                    <Badge variant={getSeverityColor(selectedPatient.severity) as any} className="mt-1">
                      {getSeverityText(selectedPatient.severity)}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="additional-notes">추가 정보</Label>
                  <Textarea 
                    id="additional-notes"
                    placeholder="환자 상태, 현장 상황 등 추가 정보를 입력하세요..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isNewPatient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={18} />
                  새 환자 정보 입력
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">환자명</Label>
                    <Input 
                      id="name" 
                      placeholder="이름을 입력하세요"
                      value={newPatientForm.name}
                      onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">나이</Label>
                    <Input 
                      id="age" 
                      type="number" 
                      placeholder="나이"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm({...newPatientForm, age: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>성별</Label>
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
                  <div>
                    <Label>중증도</Label>
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

                <div>
                  <Label htmlFor="condition">주요 증상</Label>
                  <Input 
                    id="condition" 
                    placeholder="주요 증상을 입력하세요"
                    value={newPatientForm.condition}
                    onChange={(e) => setNewPatientForm({...newPatientForm, condition: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="symptoms">상세 증상</Label>
                  <Textarea 
                    id="symptoms"
                    placeholder="환자의 상세한 증상과 현장 상황을 기록하세요..."
                    value={newPatientForm.symptoms}
                    onChange={(e) => setNewPatientForm({...newPatientForm, symptoms: e.target.value})}
                  />
                </div>

                {/* 바이탈 사인 */}
                <div>
                  <Label className="text-base font-medium">바이탈 사인 (선택사항)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label htmlFor="consciousness" className="text-sm">의식 상태</Label>
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
                    <div>
                      <Label htmlFor="bloodPressure" className="text-sm">혈압</Label>
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
                    <div>
                      <Label htmlFor="pulse" className="text-sm">맥박</Label>
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
                    <div>
                      <Label htmlFor="respiration" className="text-sm">호흡</Label>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send size={18} />
                병원 요청
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
                onClick={handleEmergencyRequest}
              >
                <AlertTriangle size={16} className="mr-2" />
                응급 요청 (위급)
              </Button>
              
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
                onClick={handleUrgentRequest}
              >
                <Heart size={16} className="mr-2" />
                응급 요청 (긴급)
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleNormalRequest}
              >
                <Activity size={16} className="mr-2" />
                일반 이송 요청
              </Button>

              <div className="pt-2">
                <Button variant="ghost" className="w-full" size="sm">
                  <Phone size={14} className="mr-2" />
                  병원과 직접 통화
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}