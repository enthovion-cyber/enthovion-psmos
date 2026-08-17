import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function InterlockImpairmentsPage({ params }: { params: { interlockId: string } }) {
  return <ImpairmentDashboardPage initialFilters={{ safeguardType: 'Interlock', safeguardId: params.interlockId }} />;
}
