import { ReadinessDashboardPage } from '@/features/mechanical-integrity/readiness/ReadinessDashboardPage';

export default function MechanicalIntegrityReadinessPendingApprovalPage() {
  return <ReadinessDashboardPage initialFilters={{ status: 'Pending Approval' }} />;
}
