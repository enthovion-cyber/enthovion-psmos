import { PmPlanFormPage } from '@/features/mechanical-integrity/preventive-maintenance/PmPlanFormPage';

export default function EditPmPlanPage({ params }: { params: { pmPlanId: string } }) {
  return <PmPlanFormPage planId={params.pmPlanId} />;
}

