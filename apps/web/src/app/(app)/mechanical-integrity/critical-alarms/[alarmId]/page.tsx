import { CriticalAlarmDetailPage } from '@/features/mechanical-integrity/critical-alarms/CriticalAlarmDetailPage';

export default function MechanicalIntegrityCriticalAlarmDetailPage({ params }: { params: { alarmId: string } }) {
  return <CriticalAlarmDetailPage alarmId={params.alarmId} />;
}
