import { PsiChemicalRegistryPage } from '@/features/psi/chemicals/PsiChemicalRegistryPage';

export default function MissingSdsPage() {
  return <PsiChemicalRegistryPage preset={{ sdsStatus: 'Missing' }} />;
}
