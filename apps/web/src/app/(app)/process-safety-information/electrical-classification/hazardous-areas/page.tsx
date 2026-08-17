import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function ElectricalHazardousAreasPage() {
  return <ElectricalClassificationRegistryPage preset={{ hazardousAreas: true }} />;
}
