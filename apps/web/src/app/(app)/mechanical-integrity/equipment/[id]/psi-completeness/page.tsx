import { PsiCompletenessMatrixPage } from '@/features/psi/completeness/PsiCompletenessMatrixPage';

export default function MiEquipmentPsiCompletenessRoute({ params }: { params: { id: string } }) {
  return <PsiCompletenessMatrixPage filters={{ equipmentId: params.id }} />;
}
