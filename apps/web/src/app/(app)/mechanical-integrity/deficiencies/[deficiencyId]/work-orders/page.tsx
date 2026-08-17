import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityDeficiencyWorkOrdersPage({ params }: { params: { deficiencyId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Deficiency', sourceRecordId: params.deficiencyId, linkedDeficiencyId: params.deficiencyId }} />;
}
