import { CriticalAlarmRegistryPage } from '@/features/mechanical-integrity/critical-alarms/CriticalAlarmRegistryPage';

export default function EquipmentCriticalAlarmsPage({ params }: { params: { id: string } }) {
  return <CriticalAlarmRegistryPage equipmentId={params.id} />;
}
