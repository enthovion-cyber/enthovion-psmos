import { WorkOrderDetailPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDetailPage';

export default function MechanicalIntegrityExecuteWorkOrderPage({ params }: { params: { workOrderId: string } }) {
  return <WorkOrderDetailPage workOrderId={params.workOrderId} mode="execute" />;
}
