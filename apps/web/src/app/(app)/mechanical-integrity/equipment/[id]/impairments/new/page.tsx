import { ImpairmentFormPage } from '@/features/mechanical-integrity/impairments/ImpairmentFormPage';

export default function NewEquipmentImpairmentPage({ params }: { params: { id: string } }) {
  return <ImpairmentFormPage preset={{ equipmentId: params.id }} />;
}
