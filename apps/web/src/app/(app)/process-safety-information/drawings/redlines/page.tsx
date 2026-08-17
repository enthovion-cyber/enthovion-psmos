import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function PsiRedlineDrawingsPage() {
  return <DrawingRegistryPage preset={{ redlineStatus: 'Open' }} />;
}
