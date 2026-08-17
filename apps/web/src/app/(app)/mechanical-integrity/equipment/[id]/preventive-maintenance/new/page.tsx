import { PmPlanFormPage } from '@/features/mechanical-integrity/preventive-maintenance/PmPlanFormPage';

export default function NewEquipmentPmPlanPage({ params }: { params: { id: string } }) {
  return <PmPlanFormPage equipmentId={params.id} />;
}

