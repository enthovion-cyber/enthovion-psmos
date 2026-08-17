import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function EquipmentDrawingsPage({ params }: { params: { equipmentId: string } }) {
  return <DrawingRegistryPage equipmentId={params.equipmentId} />;
}
