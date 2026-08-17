import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function UnitElectricalClassificationPage({ params }: { params: { unitId: string } }) {
  return <ElectricalClassificationRegistryPage unitId={params.unitId} />;
}
