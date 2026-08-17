import { InspectionPlanFormPage } from '@/features/mechanical-integrity/inspection-plans/InspectionPlanFormPage';

export default function NewEquipmentInspectionPlanPage({ params }: { params: { id: string } }) {
  return <InspectionPlanFormPage equipmentId={params.id} />;
}
