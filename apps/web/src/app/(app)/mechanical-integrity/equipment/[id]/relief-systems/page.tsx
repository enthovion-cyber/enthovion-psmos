import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function MiEquipmentReliefSystemsPage({ params }: { params: { id: string } }) {
  return <ReliefSystemRegistryPage equipmentId={params.id} />;
}
