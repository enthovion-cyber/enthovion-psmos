import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function ElectricalMocRequiredPage() {
  return <ElectricalClassificationRegistryPage preset={{ mocRequired: true }} />;
}
