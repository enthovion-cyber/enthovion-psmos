import { PsiUnitDetailPage } from '@/features/psi/units/PsiUnitDetailPage';

export default function PsiUnitProfileRoute({ params }: { params: { unitId: string } }) {
  return <PsiUnitDetailPage unitId={params.unitId} tab="profile" />;
}
