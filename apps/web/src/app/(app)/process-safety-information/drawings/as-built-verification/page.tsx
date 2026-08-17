import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function PsiAsBuiltVerificationDrawingsPage() {
  return <DrawingRegistryPage preset={{ asBuilt: 'required' }} />;
}
