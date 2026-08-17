import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function SifImpairmentsPage({ params }: { params: { sifId: string } }) {
  return <ImpairmentDashboardPage initialFilters={{ safeguardType: 'SIS / SIF', safeguardId: params.sifId }} />;
}
