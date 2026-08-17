import { InspectionPlanTab } from '@/features/mechanical-integrity/equipment-detail/tabs/InspectionPlanTab';

export default function EquipmentInspectionPlanPage({ params }: { params: { id: string } }) {
  return <InspectionPlanTab equipmentId={params.id} />;
}
