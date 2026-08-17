import { PsiChemicalFormPage } from '@/features/psi/chemicals/PsiChemicalFormPage';

export default function EditPsiChemicalPage({ params }: { params: { chemicalId: string } }) {
  return <PsiChemicalFormPage chemicalId={params.chemicalId} />;
}
