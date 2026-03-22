import { InfoCard } from '../common/InfoCard';
import { Building2, Users, Clock, CheckCircle2 } from 'lucide-react';

interface HospitalKPIsProps {
  availableBeds: number;
  erQueue: number;
  avgWaitTime: number;
  todayProcessed: number;
}

export function HospitalKPIs({
  availableBeds,
  erQueue,
  avgWaitTime,
  todayProcessed,
}: HospitalKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <InfoCard
        title="가용 병상"
        value={availableBeds}
        subtitle="현재 이용 가능"
        variant="success"
        icon={<Building2 size={18} />}
        trend={{ value: '2', positive: true }}
      />
      <InfoCard
        title="ER 대기열"
        value={`${erQueue}명`}
        subtitle="현재 대기 중"
        variant="warning"
        icon={<Users size={18} />}
        trend={{ value: '3', positive: false }}
      />
      <InfoCard
        title="평균 대기시간"
        value={`${avgWaitTime}분`}
        subtitle="최근 1시간 평균"
        variant="default"
        icon={<Clock size={18} />}
        trend={{ value: '12%', positive: true }}
      />
      <InfoCard
        title="오늘 처리"
        value={todayProcessed}
        subtitle="완료된 케이스"
        variant="default"
        icon={<CheckCircle2 size={18} />}
        trend={{ value: '8%', positive: true }}
      />
    </div>
  );
}
