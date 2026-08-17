import { InspectionPlanDetailPage } from '@/features/mechanical-integrity/inspection-plans/detail/InspectionPlanDetailPage';

export default function InspectionPlanRevisionsPage({ params }: { params: { planId: string } }) {
  return <InspectionPlanDetailPage planId={params.planId} initialTab="revisions" />;
}
