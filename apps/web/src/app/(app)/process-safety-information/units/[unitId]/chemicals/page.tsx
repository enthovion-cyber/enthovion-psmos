import { PsiChemicalRegistryPage } from '@/features/psi/chemicals/PsiChemicalRegistryPage';

export default function UnitChemicalsPage({ params }: { params: { unitId: string } }) {
  return <PsiChemicalRegistryPage unitId={params.unitId} />;
}
