import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { getSeverityColor, getSeverityText } from '../../utils/statusHelpers';
import { User, Thermometer, Plus } from 'lucide-react';
import type { QuickPatient } from './QuickPatientSelector';

export interface NewPatientFormState {
  name: string;
  age: string;
  gender: string;
  condition: string;
  severity: string;
  symptoms: string;
  vitals: {
    consciousness: string;
    bloodPressure: string;
    pulse: string;
    respiration: string;
    temperature: string;
    oxygenSaturation: string;
  };
}

interface SelectedPatientCardProps {
  patient: QuickPatient;
  additionalNotes: string;
  onNotesChange: (value: string) => void;
}

export function SelectedPatientCard({
  patient,
  additionalNotes,
  onNotesChange,
}: SelectedPatientCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User size={18} />
          선택된 환자 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">이름</Label>
            <p className="font-medium">{patient.name}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">나이/성별</Label>
            <p className="font-medium">
              {patient.age}세 / {patient.gender}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">증상</Label>
            <p className="font-medium">{patient.condition}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">중증도</Label>
            <div>
              <Badge variant={getSeverityColor(patient.severity)}>
                {getSeverityText(patient.severity)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="additional-notes" className="text-sm font-medium text-muted-foreground">
            추가 정보
          </Label>
          <Textarea
            id="additional-notes"
            placeholder="환자 상태, 현장 상황 등 추가 정보를 입력하세요..."
            value={additionalNotes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface NewPatientFormProps {
  form: NewPatientFormState;
  onChange: (form: NewPatientFormState) => void;
}

export function NewPatientForm({ form, onChange }: NewPatientFormProps) {
  const update = (partial: Partial<NewPatientFormState>) => onChange({ ...form, ...partial });

  const updateVitals = (partial: Partial<NewPatientFormState['vitals']>) =>
    onChange({ ...form, vitals: { ...form.vitals, ...partial } });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus size={18} />새 환자 정보 입력
        </CardTitle>
        <p className="text-xs text-muted-foreground">필수 항목을 입력해주세요</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
              환자명 *
            </Label>
            <Input
              id="name"
              placeholder="이름을 입력하세요"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age" className="text-sm font-medium text-muted-foreground">
              나이 *
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="나이"
              value={form.age}
              onChange={(e) => update({ age: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">성별</Label>
            <Select value={form.gender} onValueChange={(value) => update({ gender: value })}>
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
            <Select value={form.severity} onValueChange={(value) => update({ severity: value })}>
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
          <Label htmlFor="condition" className="text-sm font-medium text-muted-foreground">
            주요 증상 *
          </Label>
          <Input
            id="condition"
            placeholder="주요 증상을 입력하세요"
            value={form.condition}
            onChange={(e) => update({ condition: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="symptoms" className="text-sm font-medium text-muted-foreground">
            상세 증상
          </Label>
          <Textarea
            id="symptoms"
            placeholder="환자의 상세한 증상과 현장 상황을 기록하세요..."
            value={form.symptoms}
            onChange={(e) => update({ symptoms: e.target.value })}
          />
        </div>

        <Separator />

        {/* 바이탈 사인 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-muted-foreground" />
            <Label className="text-sm font-medium text-muted-foreground">
              바이탈 사인 (선택사항)
            </Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="consciousness" className="text-xs font-medium text-muted-foreground">
                의식 상태
              </Label>
              <Input
                id="consciousness"
                placeholder="명료/혼미/혼수 등"
                value={form.vitals.consciousness}
                onChange={(e) => updateVitals({ consciousness: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bloodPressure" className="text-xs font-medium text-muted-foreground">
                혈압
              </Label>
              <Input
                id="bloodPressure"
                placeholder="120/80"
                value={form.vitals.bloodPressure}
                onChange={(e) => updateVitals({ bloodPressure: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pulse" className="text-xs font-medium text-muted-foreground">
                맥박
              </Label>
              <Input
                id="pulse"
                placeholder="80 bpm"
                value={form.vitals.pulse}
                onChange={(e) => updateVitals({ pulse: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="respiration" className="text-xs font-medium text-muted-foreground">
                호흡
              </Label>
              <Input
                id="respiration"
                placeholder="20 /min"
                value={form.vitals.respiration}
                onChange={(e) => updateVitals({ respiration: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="oxygenSaturation"
                className="text-xs font-medium text-muted-foreground"
              >
                산소포화도 (SpO2)
              </Label>
              <Input
                id="oxygenSaturation"
                type="number"
                min={0}
                max={100}
                placeholder="98%"
                value={form.vitals.oxygenSaturation}
                onChange={(e) => updateVitals({ oxygenSaturation: e.target.value })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
