import { PsiCompletenessMatrixPage } from '@/features/psi/completeness/PsiCompletenessMatrixPage';

export default function PsiUnitCompletenessMatrixRoute({ params }: { params: { unitId: string } }) {
  return <PsiCompletenessMatrixPage filters={{ unitId: params.unitId }} />;
}
