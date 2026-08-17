import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityOverdueWorkOrdersPage() {
  return <WorkOrderDashboardPage initialFilters={{ overdue: true }} />;
}
