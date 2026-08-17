import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityImpairmentWorkOrdersPage({ params }: { params: { impairmentId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Bypass / Impairment', sourceRecordId: params.impairmentId }} />;
}
