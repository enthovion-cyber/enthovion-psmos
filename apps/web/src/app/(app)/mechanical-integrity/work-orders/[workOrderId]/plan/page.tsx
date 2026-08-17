import { WorkOrderDetailPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDetailPage';

export default function MechanicalIntegrityPlanWorkOrderPage({ params }: { params: { workOrderId: string } }) {
  return <WorkOrderDetailPage workOrderId={params.workOrderId} mode="plan" />;
}
