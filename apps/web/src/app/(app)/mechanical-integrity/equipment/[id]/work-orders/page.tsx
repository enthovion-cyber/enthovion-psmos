import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityEquipmentWorkOrdersPage({ params }: { params: { id: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ equipmentId: params.id }} />;
}
