import { CriticalAlarmFormPage } from '@/features/mechanical-integrity/critical-alarms/CriticalAlarmFormPage';

export default function MechanicalIntegrityEditCriticalAlarmPage({ params }: { params: { alarmId: string } }) {
  return <CriticalAlarmFormPage alarmId={params.alarmId} />;
}
