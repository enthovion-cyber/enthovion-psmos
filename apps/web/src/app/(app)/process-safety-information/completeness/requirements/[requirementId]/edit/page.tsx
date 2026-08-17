import { PsiRequirementFormPage } from '@/features/psi/completeness/PsiRequirementFormPage';

export default function PsiCompletenessRequirementEditRoute({ params }: { params: { requirementId: string } }) {
  return <PsiRequirementFormPage requirementId={params.requirementId} />;
}
