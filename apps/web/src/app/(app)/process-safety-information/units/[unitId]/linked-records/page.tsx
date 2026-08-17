import { PsiUnitDetailPage } from '@/features/psi/units/PsiUnitDetailPage';

export default function PsiUnitLinkedRecordsRoute({ params }: { params: { unitId: string } }) {
  return <PsiUnitDetailPage unitId={params.unitId} tab="linked-records" />;
}
