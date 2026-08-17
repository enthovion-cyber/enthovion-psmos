import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function PsiSupersededDrawingsPage() {
  return <DrawingRegistryPage preset={{ status: 'Superseded' }} />;
}
