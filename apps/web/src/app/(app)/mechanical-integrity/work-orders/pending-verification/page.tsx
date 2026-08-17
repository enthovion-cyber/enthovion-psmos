import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityPendingVerificationWorkOrdersPage() {
  return <WorkOrderDashboardPage initialFilters={{ pendingVerification: true }} />;
}
