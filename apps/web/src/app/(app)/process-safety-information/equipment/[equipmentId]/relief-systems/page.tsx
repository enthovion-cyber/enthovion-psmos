import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function EquipmentReliefSystemsPage({ params }: { params: { equipmentId: string } }) {
  return <ReliefSystemRegistryPage equipmentId={params.equipmentId} />;
}
