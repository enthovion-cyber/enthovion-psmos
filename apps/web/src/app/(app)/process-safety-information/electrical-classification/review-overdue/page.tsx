import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function ElectricalReviewOverduePage() {
  return <ElectricalClassificationRegistryPage preset={{ reviewOverdue: true }} />;
}
