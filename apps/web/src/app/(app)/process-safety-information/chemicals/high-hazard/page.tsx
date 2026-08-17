import { PsiChemicalRegistryPage } from '@/features/psi/chemicals/PsiChemicalRegistryPage';

export default function HighHazardChemicalsPage() {
  return <PsiChemicalRegistryPage preset={{ highHazard: 'true' }} />;
}
