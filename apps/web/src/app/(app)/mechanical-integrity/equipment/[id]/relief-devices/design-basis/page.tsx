import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function MiEquipmentReliefDeviceDesignBasisPage({ params }: { params: { id: string } }) {
  return <ReliefSystemRegistryPage equipmentId={params.id} />;
}
