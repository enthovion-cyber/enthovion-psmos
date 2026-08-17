import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function ReliefSystemReviewOverduePage() {
  return <ReliefSystemRegistryPage preset={{ reviewOverdue: 'true' }} />;
}
