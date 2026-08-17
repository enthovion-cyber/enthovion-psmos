import { PsiCompletenessRunDialog } from '@/features/psi/completeness/PsiCompletenessRunDialog';

export default function PsiUnitCompletenessRunRoute({ params }: { params: { unitId: string } }) {
  return <PsiCompletenessRunDialog input={{ unitId: params.unitId, run_scope: 'Unit' }} />;
}
