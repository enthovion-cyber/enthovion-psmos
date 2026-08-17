import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegritySafeguardTestWorkOrdersPage({ params }: { params: { testId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Safeguard Test', sourceRecordId: params.testId }} />;
}
