import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityPmWorkOrdersPage({ params }: { params: { pmRecordId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Preventive Maintenance', sourceRecordId: params.pmRecordId }} />;
}
