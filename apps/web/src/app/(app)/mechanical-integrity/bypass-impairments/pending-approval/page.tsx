import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function PendingApprovalBypassImpairmentsPage() {
  return <ImpairmentDashboardPage initialFilters={{ status: 'Pending Approval' }} />;
}
