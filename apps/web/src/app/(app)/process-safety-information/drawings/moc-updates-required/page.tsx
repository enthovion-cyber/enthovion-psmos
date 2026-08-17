import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function PsiMocDrawingUpdatesRequiredPage() {
  return <DrawingRegistryPage preset={{ mocUpdateRequired: true }} />;
}
