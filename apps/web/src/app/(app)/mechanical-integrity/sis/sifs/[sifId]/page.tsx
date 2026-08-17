import { SifDetailPage } from '@/features/mechanical-integrity/sif/detail/SifDetailPage';

export default function MechanicalIntegritySifDetailPage({ params }: { params: { sifId: string } }) {
  return <SifDetailPage sifId={params.sifId} />;
}
