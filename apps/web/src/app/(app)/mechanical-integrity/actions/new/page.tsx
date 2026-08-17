import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewActionPage() {
  return <WorkOrderFormPage preset={{ workOrderType: 'Corrective maintenance', sourceModule: 'Manual' }} />;
}
