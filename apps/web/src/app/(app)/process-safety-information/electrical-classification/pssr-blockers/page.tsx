import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function ElectricalPssrBlockersPage() {
  return <ElectricalClassificationRegistryPage preset={{ pssrBlockers: true }} />;
}
