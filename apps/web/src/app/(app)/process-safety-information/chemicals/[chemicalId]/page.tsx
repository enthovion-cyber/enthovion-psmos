import { PsiChemicalDetailPage } from '@/features/psi/chemicals/PsiChemicalDetailPage';

export default function PsiChemicalDetailRoute({ params }: { params: { chemicalId: string } }) {
  return <PsiChemicalDetailPage chemicalId={params.chemicalId} />;
}
