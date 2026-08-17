import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewEquipmentWorkOrderPage({ params }: { params: { id: string } }) {
  return <WorkOrderFormPage preset={{ equipmentId: params.id }} />;
}
