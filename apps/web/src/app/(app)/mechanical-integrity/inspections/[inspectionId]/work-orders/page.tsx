import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityInspectionWorkOrdersPage({ params }: { params: { inspectionId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Inspection', sourceRecordId: params.inspectionId }} />;
}
