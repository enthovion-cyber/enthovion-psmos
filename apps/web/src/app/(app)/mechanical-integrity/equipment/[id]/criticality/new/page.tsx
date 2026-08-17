import { CriticalityAssessmentFormPage } from '@/features/mechanical-integrity/criticality/assessment/CriticalityAssessmentFormPage';

export default function Page({ params }: { params: { id: string } }) {
  return <CriticalityAssessmentFormPage equipmentId={params.id} />;
}
