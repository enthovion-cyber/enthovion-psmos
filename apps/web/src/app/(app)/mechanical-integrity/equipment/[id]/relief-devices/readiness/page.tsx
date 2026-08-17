import { ReliefDevicesTab } from '@/features/mechanical-integrity/equipment-detail/tabs/ReliefDevicesTab';

export default function Page({ params }: { params: { id: string } }) {
  return <ReliefDevicesTab equipmentId={params.id} />;
}
