import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityOpenWorkOrdersPage() {
  return <WorkOrderDashboardPage initialFilters={{ closed: false }} />;
}
