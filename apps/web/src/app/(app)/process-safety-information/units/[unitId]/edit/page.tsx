import { PsiUnitFormPage } from '@/features/psi/units/PsiUnitFormPage';

export default function EditPsiUnitRoute({ params }: { params: { unitId: string } }) {
  return <PsiUnitFormPage unitId={params.unitId} />;
}
