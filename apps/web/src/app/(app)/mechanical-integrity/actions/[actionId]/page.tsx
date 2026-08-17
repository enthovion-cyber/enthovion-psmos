import { WorkOrderDetailPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDetailPage';

export default function MechanicalIntegrityActionDetailPage({ params }: { params: { actionId: string } }) {
  return <WorkOrderDetailPage workOrderId={params.actionId} />;
}
