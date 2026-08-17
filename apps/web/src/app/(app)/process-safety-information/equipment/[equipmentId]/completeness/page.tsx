import { PsiCompletenessMatrixPage } from '@/features/psi/completeness/PsiCompletenessMatrixPage';

export default function PsiEquipmentCompletenessRoute({ params }: { params: { equipmentId: string } }) {
  return <PsiCompletenessMatrixPage filters={{ equipmentId: params.equipmentId }} />;
}
