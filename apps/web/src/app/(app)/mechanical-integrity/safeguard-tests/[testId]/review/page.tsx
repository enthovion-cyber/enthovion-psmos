import { SafeguardTestDetailPage } from '@/features/mechanical-integrity/safeguard-tests/SafeguardTestDetailPage';

export default function MechanicalIntegrityReviewSafeguardTestPage({ params }: { params: { testId: string } }) {
  return <SafeguardTestDetailPage testId={params.testId} reviewMode />;
}
