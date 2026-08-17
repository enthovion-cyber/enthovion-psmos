import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityEditWorkOrderPage({ params }: { params: { workOrderId: string } }) {
  return <WorkOrderFormPage workOrderId={params.workOrderId} />;
}
