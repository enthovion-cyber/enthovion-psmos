import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function PsiPendingApprovalDrawingsPage() {
  return <DrawingRegistryPage preset={{ reviewStatus: 'Pending Approval' }} />;
}
