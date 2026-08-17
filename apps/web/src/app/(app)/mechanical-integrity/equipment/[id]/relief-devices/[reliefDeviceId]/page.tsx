import { ReliefDeviceDetailPage } from '@/features/mechanical-integrity/relief-devices/detail/ReliefDeviceDetailPage';

export default function Page({ params }: { params: { reliefDeviceId: string } }) {
  return <ReliefDeviceDetailPage reliefDeviceId={params.reliefDeviceId} />;
}
