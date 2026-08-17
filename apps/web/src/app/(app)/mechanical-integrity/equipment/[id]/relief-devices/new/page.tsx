import { ReliefDeviceFormPage } from '@/features/mechanical-integrity/relief-devices/ReliefDeviceFormPage';

export default function Page({ params }: { params: { id: string } }) {
  return <ReliefDeviceFormPage equipmentId={params.id} />;
}
