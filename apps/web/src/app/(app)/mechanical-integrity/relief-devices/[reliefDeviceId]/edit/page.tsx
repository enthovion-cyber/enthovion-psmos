import { ReliefDeviceFormPage } from '@/features/mechanical-integrity/relief-devices/ReliefDeviceFormPage';

export default function Page({ params }: { params: { reliefDeviceId: string } }) {
  return <ReliefDeviceFormPage reliefDeviceId={params.reliefDeviceId} />;
}
