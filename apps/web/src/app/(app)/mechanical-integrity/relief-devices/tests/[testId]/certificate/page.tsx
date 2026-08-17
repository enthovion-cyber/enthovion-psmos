import { ReliefTestDetailPage } from '@/features/mechanical-integrity/relief-tests/ReliefTestDetailPage';

export default function Page({ params }: { params: { testId: string } }) {
  return <ReliefTestDetailPage testId={params.testId} />;
}
