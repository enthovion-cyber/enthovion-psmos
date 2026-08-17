import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewPmWorkOrderPage({ params }: { params: { pmRecordId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Preventive Maintenance', sourceRecordId: params.pmRecordId }} />;
}
