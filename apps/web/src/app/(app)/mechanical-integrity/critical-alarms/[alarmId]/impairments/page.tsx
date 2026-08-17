import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function CriticalAlarmImpairmentsPage({ params }: { params: { alarmId: string } }) {
  return <ImpairmentDashboardPage initialFilters={{ safeguardType: 'Critical Alarm', safeguardId: params.alarmId }} />;
}
