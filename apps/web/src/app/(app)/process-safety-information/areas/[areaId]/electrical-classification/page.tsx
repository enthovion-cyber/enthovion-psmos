import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function AreaElectricalClassificationPage({ params }: { params: { areaId: string } }) {
  return <ElectricalClassificationRegistryPage areaId={params.areaId} />;
}
