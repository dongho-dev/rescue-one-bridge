import { InfoCard } from "../common/InfoCard";
import { Clock, CheckCircle2, Ambulance } from 'lucide-react';

interface StatusCounts {
  pending: number;
  matched: number;
  enRoute: number;
  completed: number;
}

interface ParamedicKPIsProps {
  statusCounts: StatusCounts;
}

export function ParamedicKPIs({ statusCounts }: ParamedicKPIsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InfoCard
        title="대기"
        value={statusCounts.pending}
        subtitle="매칭 대기"
        variant="default"
        icon={<Clock size={16} />}
      />
      <InfoCard
        title="배정됨"
        value={statusCounts.matched}
        subtitle="병원 배정 완료"
        variant="warning"
        icon={<CheckCircle2 size={16} />}
      />
      <InfoCard
        title="이송 중"
        value={statusCounts.enRoute}
        subtitle="병원으로 이송"
        variant="success"
        icon={<Ambulance size={16} />}
      />
      <InfoCard
        title="완료"
        value={statusCounts.completed}
        subtitle="오늘 처리"
        variant="default"
        icon={<CheckCircle2 size={16} />}
      />
    </div>
  );
}
