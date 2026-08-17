import { InspectionRecordFormPage } from '@/features/mechanical-integrity/inspection-records/InspectionRecordFormPage';

export default function NewEquipmentInspectionRecordPage({ params }: { params: { id: string } }) {
  return <InspectionRecordFormPage equipmentId={params.id} />;
}
