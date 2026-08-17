import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function PsiMissingDrawingPage() {
  return <DrawingRegistryPage preset={{ missingRequired: true }} />;
}
