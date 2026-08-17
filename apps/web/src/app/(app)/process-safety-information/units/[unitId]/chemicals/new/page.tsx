import { PsiChemicalFormPage } from '@/features/psi/chemicals/PsiChemicalFormPage';

export default function NewUnitChemicalPage({ params }: { params: { unitId: string } }) {
  return <PsiChemicalFormPage unitId={params.unitId} />;
}
