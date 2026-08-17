import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function ElectricalMissingClassificationPage() {
  return <ElectricalClassificationRegistryPage preset={{ missing: true }} />;
}
