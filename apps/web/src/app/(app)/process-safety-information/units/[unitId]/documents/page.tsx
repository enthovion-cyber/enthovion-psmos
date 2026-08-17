import { PsiUnitDetailPage } from '@/features/psi/units/PsiUnitDetailPage';

export default function PsiUnitDocumentsRoute({ params }: { params: { unitId: string } }) {
  return <PsiUnitDetailPage unitId={params.unitId} tab="documents" />;
}
