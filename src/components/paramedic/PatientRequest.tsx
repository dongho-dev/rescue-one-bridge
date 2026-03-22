import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useRequestsContext } from '@/contexts/RequestsContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { RequestPriority } from '@/types/database';
import { Ambulance, AlertTriangle, Timer } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

import type { QuickPatient } from './QuickPatientSelector';
import { QuickPatientSelector } from './QuickPatientSelector';
import type { NewPatientFormState } from './NewPatientForm';
import { NewPatientForm, SelectedPatientCard } from './NewPatientForm';
import { RequestButtons } from './RequestButtons';
import { LocationETACard } from './LocationETACard';

function mapSeverityToLabel(severity: number): 'critical' | 'urgent' | 'stable' {
  if (severity >= 4) return 'critical';
  if (severity >= 3) return 'urgent';
  return 'stable';
}

const EMPTY_FORM: NewPatientFormState = {
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
    temperature: '',
    oxygenSaturation: '',
  },
};

export function PatientRequest() {
  const { createRequest, requests } = useRequestsContext();
  const { position, refresh: refreshGeo } = useGeolocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [currentLocation, setCurrentLocation] = useState('위치 확인 중...');
  const [estimatedTime] = useState('15분');
  const [newPatientForm, setNewPatientForm] = useState<NewPatientFormState>(EMPTY_FORM);

  // 이전 요청에서 최근 환자 3명 추출 (하드코딩 제거)
  const quickPatients: QuickPatient[] = useMemo(() => {
    const seen = new Set<string>();
    return requests
      .filter((r) => r.patient_name && r.patient_name.trim())
      .filter((r) => {
        const key = `${r.patient_name}-${r.patient_age}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        name: r.patient_name!,
        age: r.patient_age ?? 0,
        gender: r.patient_gender ?? '미상',
        condition: r.symptom,
        severity: mapSeverityToLabel(r.severity),
        lastUsed: new Date(r.requested_at).toLocaleDateString('ko-KR'),
      }));
  }, [requests]);

  // GPS 좌표 → 주소 텍스트 (reverse geocoding via Nominatim)
  useEffect(() => {
    if (!position) return;
    const controller = new AbortController();
    const { latitude, longitude } = position;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ko`,
      {
        signal: controller.signal,
      },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.display_name) {
          const parts = data.display_name.split(', ').slice(0, 3);
          setCurrentLocation(parts.reverse().join(' '));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      });
    return () => controller.abort();
  }, [position]);

  const handleQuickSelect = (patient: QuickPatient) => {
    setSelectedPatient(patient);
    setIsNewPatient(false);
    toast.success(`${patient.name} 환자가 선택되었습니다.`);
  };

  const handleNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    toast.info('새 환자 정보를 입력해주세요.');
  };

  const handleLocationUpdate = () => {
    refreshGeo();
    toast.success('현재 위치가 업데이트되었습니다.');
  };

  const handleRequest = async (type: 'emergency' | 'urgent' | 'normal') => {
    if (isSubmitting) return;

    // 긴급 요청은 환자 정보 없이도 전송 가능
    const isQuickEmergency = type === 'emergency' && !selectedPatient && !isNewPatient;

    if (!isQuickEmergency && !selectedPatient && !isNewPatient) {
      toast.error('환자를 선택하거나 새 환자 정보를 입력해주세요.');
      return;
    }

    if (isNewPatient && !isQuickEmergency) {
      if (!newPatientForm.name.trim()) {
        toast.error('환자 이름을 입력해주세요.');
        return;
      }
      if (!newPatientForm.age.trim()) {
        toast.error('환자 나이를 입력해주세요.');
        return;
      }
      const ageNum = parseInt(newPatientForm.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        toast.error('나이는 0~150 사이의 숫자여야 합니다.');
        return;
      }
      if (!newPatientForm.severity) {
        toast.error('중증도를 선택해주세요.');
        return;
      }
      if (!newPatientForm.condition.trim()) {
        toast.error('주요 증상을 입력해주세요.');
        return;
      }
    }

    const severityMap: Record<string, number> = { critical: 5, urgent: 3, stable: 1 };
    const patientSeverity = isQuickEmergency
      ? 5
      : selectedPatient
        ? (severityMap[selectedPatient.severity] ?? 3)
        : (severityMap[newPatientForm.severity] ?? 3);

    setIsSubmitting(true);
    try {
      await createRequest({
        priority: type as RequestPriority,
        severity: patientSeverity,
        symptom: isQuickEmergency
          ? '긴급 요청'
          : selectedPatient
            ? selectedPatient.condition
            : newPatientForm.condition,
        patient_name: isQuickEmergency
          ? undefined
          : selectedPatient
            ? selectedPatient.name
            : newPatientForm.name || undefined,
        patient_age: isQuickEmergency
          ? undefined
          : selectedPatient
            ? selectedPatient.age
            : Number(newPatientForm.age) || undefined,
        patient_gender: isQuickEmergency
          ? undefined
          : selectedPatient
            ? selectedPatient.gender
            : newPatientForm.gender || undefined,
        vitals:
          isNewPatient && !isQuickEmergency
            ? {
                blood_pressure: newPatientForm.vitals.bloodPressure || undefined,
                heart_rate: Number(newPatientForm.vitals.pulse) || undefined,
                temperature: Number(newPatientForm.vitals.temperature) || undefined,
                consciousness: newPatientForm.vitals.consciousness || undefined,
                respiration: Number(newPatientForm.vitals.respiration) || undefined,
                oxygen_saturation: Number(newPatientForm.vitals.oxygenSaturation) || undefined,
              }
            : undefined,
        notes: isQuickEmergency
          ? undefined
          : isNewPatient
            ? newPatientForm.symptoms || undefined
            : additionalNotes || undefined,
        location_text: currentLocation,
        latitude: position?.latitude ?? undefined,
        longitude: position?.longitude ?? undefined,
      });

      // Reset form on success
      setSelectedPatient(null);
      setIsNewPatient(false);
      setAdditionalNotes('');
      setNewPatientForm(EMPTY_FORM);
    } catch {
      // Error already handled by the hook via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 원탭 긴급 요청 */}
      <Card className="border-red-300 bg-red-50/80 dark:bg-red-950/30 dark:border-red-800 shadow-md">
        <CardContent className="pt-5 pb-5">
          <Button
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg font-bold min-h-[64px] shadow-lg shadow-red-600/30 touch-manipulation"
            onClick={() => handleRequest('emergency')}
            disabled={isSubmitting}
          >
            <AlertTriangle size={24} className="mr-3" />
            {isSubmitting ? '전송 중...' : '긴급 요청 (환자 정보 없이)'}
          </Button>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 text-center mt-2">
            환자 정보 입력 없이 현재 위치로 즉시 요청합니다
          </p>
        </CardContent>
      </Card>

      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
            <Ambulance size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">구급대원 환자 요청</h1>
            <p className="text-sm text-muted-foreground">환자 정보를 입력하고 병원에 요청하세요</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Timer size={14} />
          {estimatedTime} 도착 예정
        </Badge>
      </div>

      {/* 위치/ETA 정보 */}
      <LocationETACard
        currentLocation={currentLocation}
        estimatedTime={estimatedTime}
        onLocationUpdate={handleLocationUpdate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 환자 선택 */}
        <div className="space-y-4">
          <QuickPatientSelector
            quickPatients={quickPatients}
            selectedPatient={selectedPatient}
            isNewPatient={isNewPatient}
            onSelect={handleQuickSelect}
            onNewPatient={handleNewPatient}
          />
        </div>

        {/* 오른쪽: 환자 정보 및 요청 */}
        <div className="space-y-4">
          {selectedPatient && !isNewPatient && (
            <SelectedPatientCard
              patient={selectedPatient}
              additionalNotes={additionalNotes}
              onNotesChange={setAdditionalNotes}
            />
          )}

          {isNewPatient && <NewPatientForm form={newPatientForm} onChange={setNewPatientForm} />}

          <RequestButtons isSubmitting={isSubmitting} onRequest={handleRequest} />
        </div>
      </div>
    </div>
  );
}
