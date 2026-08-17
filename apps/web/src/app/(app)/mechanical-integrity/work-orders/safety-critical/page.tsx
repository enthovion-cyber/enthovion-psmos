import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegritySafetyCriticalWorkOrdersPage() {
  return <WorkOrderDashboardPage initialFilters={{ safetyCritical: true }} />;
}
