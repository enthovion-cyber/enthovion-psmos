import { PsiUnitDetailPage } from '@/features/psi/units/PsiUnitDetailPage';

export default function PsiUnitDetailRoute({ params }: { params: { unitId: string } }) {
  return <PsiUnitDetailPage unitId={params.unitId} />;
}
