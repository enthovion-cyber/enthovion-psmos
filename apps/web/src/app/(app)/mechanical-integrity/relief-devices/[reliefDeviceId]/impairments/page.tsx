import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function ReliefDeviceImpairmentsPage({ params }: { params: { reliefDeviceId: string } }) {
  return <ImpairmentDashboardPage initialFilters={{ safeguardType: 'PSV / Relief Device', safeguardId: params.reliefDeviceId }} />;
}
