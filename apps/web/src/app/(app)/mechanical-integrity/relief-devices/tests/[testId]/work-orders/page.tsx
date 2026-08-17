import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityReliefTestWorkOrdersPage({ params }: { params: { testId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Relief Device Test', sourceRecordId: params.testId }} />;
}
