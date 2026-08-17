import { SifFormPage } from '@/features/mechanical-integrity/sif/SifFormPage';

export default function EquipmentNewSifPage({ params }: { params: { id: string } }) {
  return <SifFormPage equipmentId={params.id} />;
}
