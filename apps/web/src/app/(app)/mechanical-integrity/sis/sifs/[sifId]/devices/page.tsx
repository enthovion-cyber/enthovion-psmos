import { SifDetailPage } from '@/features/mechanical-integrity/sif/detail/SifDetailPage';

export default function MechanicalIntegritySifDevicesPage({ params }: { params: { sifId: string } }) {
  return <SifDetailPage sifId={params.sifId} />;
}
