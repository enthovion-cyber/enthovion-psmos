import { InspectionPlanFormPage } from '@/features/mechanical-integrity/inspection-plans/InspectionPlanFormPage';

export default function EditInspectionPlanPage({ params }: { params: { planId: string } }) {
  return <InspectionPlanFormPage planId={params.planId} />;
}
