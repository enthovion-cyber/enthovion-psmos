import { ReadinessDashboardPage } from '@/features/mechanical-integrity/readiness/ReadinessDashboardPage';

export default function PssrReadinessRoute({ params }: { params: { pssrId: string } }) {
  return <ReadinessDashboardPage initialFilters={{ pssrId: params.pssrId }} />;
}
