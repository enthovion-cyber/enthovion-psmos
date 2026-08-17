import { SafeguardTestDetailPage } from '@/features/mechanical-integrity/safeguard-tests/SafeguardTestDetailPage';

export default function MechanicalIntegritySafeguardTestDetailPage({ params }: { params: { testId: string } }) {
  return <SafeguardTestDetailPage testId={params.testId} />;
}
