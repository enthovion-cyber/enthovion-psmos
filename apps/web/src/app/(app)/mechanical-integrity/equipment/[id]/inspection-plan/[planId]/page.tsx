import { InspectionPlanDetailPage } from '@/features/mechanical-integrity/inspection-plans/detail/InspectionPlanDetailPage';

export default function EquipmentInspectionPlanDetailPage({ params }: { params: { planId: string } }) {
  return <InspectionPlanDetailPage planId={params.planId} />;
}
