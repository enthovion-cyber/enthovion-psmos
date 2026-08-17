import { SifFormPage } from '@/features/mechanical-integrity/sif/SifFormPage';

export default function MechanicalIntegrityEditSifPage({ params }: { params: { sifId: string } }) {
  return <SifFormPage sifId={params.sifId} />;
}
