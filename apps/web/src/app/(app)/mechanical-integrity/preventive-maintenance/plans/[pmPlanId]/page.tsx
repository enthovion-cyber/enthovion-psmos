import { PmPlanDetailPage } from '@/features/mechanical-integrity/preventive-maintenance/PmPlanDetailPage';

export default function PmPlanPage({ params }: { params: { pmPlanId: string } }) {
  return <PmPlanDetailPage planId={params.pmPlanId} />;
}

