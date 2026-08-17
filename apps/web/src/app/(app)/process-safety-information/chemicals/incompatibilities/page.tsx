import { PsiChemicalRegistryPage } from '@/features/psi/chemicals/PsiChemicalRegistryPage';

export default function ChemicalIncompatibilitiesPage() {
  return <PsiChemicalRegistryPage preset={{ compatibilityRisk: 'High' }} />;
}
