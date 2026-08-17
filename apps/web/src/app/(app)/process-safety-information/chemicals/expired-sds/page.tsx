import { PsiChemicalRegistryPage } from '@/features/psi/chemicals/PsiChemicalRegistryPage';

export default function ExpiredSdsPage() {
  return <PsiChemicalRegistryPage preset={{ sdsStatus: 'Expired' }} />;
}
