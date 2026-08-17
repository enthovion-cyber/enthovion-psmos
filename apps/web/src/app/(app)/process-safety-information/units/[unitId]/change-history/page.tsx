import { PsiUnitDetailPage } from '@/features/psi/units/PsiUnitDetailPage';

export default function PsiUnitChangeHistoryRoute({ params }: { params: { unitId: string } }) {
  return <PsiUnitDetailPage unitId={params.unitId} tab="history" />;
}
