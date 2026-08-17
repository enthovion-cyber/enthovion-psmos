import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function MiEquipmentElectricalClassificationPage({ params }: { params: { id: string } }) {
  return <ElectricalClassificationRegistryPage equipmentId={params.id} />;
}
