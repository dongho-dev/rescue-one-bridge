import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { getSeverityColor, getSeverityText } from '../../utils/statusHelpers';
import { User, Clock, Plus, Users } from 'lucide-react';

export interface QuickPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  severity: 'critical' | 'urgent' | 'stable';
  lastUsed: string;
}

interface QuickPatientSelectorProps {
  quickPatients: QuickPatient[];
  selectedPatient: QuickPatient | null;
  isNewPatient: boolean;
  onSelect: (patient: QuickPatient) => void;
  onNewPatient: () => void;
}

export function QuickPatientSelector({
  quickPatients,
  selectedPatient,
  isNewPatient,
  onSelect,
  onNewPatient,
}: QuickPatientSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users size={18} />
          빠른 환자 선택
        </CardTitle>
        <p className="text-xs text-muted-foreground">최근 환자 중 선택하거나 새로 등록하세요</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickPatients.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">
            이전 요청 기록이 없습니다. 새 환자를 등록해주세요.
          </p>
        )}
        {quickPatients.map((patient) => (
          <Card
            key={patient.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
              selectedPatient?.id === patient.id
                ? 'ring-2 ring-primary shadow-md bg-primary/5'
                : 'hover:bg-muted/30'
            }`}
            onClick={() => onSelect(patient)}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-full ${
                      selectedPatient?.id === patient.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <User size={14} />
                  </div>
                  <span className="font-medium">{patient.name}</span>
                </div>
                <Badge variant={getSeverityColor(patient.severity)}>
                  {getSeverityText(patient.severity)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 pl-7">
                <p>
                  {patient.age}세 / {patient.gender}
                </p>
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
          variant={isNewPatient ? 'default' : 'outline'}
          className="w-full"
          onClick={onNewPatient}
        >
          <Plus size={16} className="mr-2" />새 환자 등록
        </Button>
      </CardContent>
    </Card>
  );
}
