import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function EquipmentElectricalClassificationPage({ params }: { params: { equipmentId: string } }) {
  return <ElectricalClassificationRegistryPage equipmentId={params.equipmentId} />;
}
