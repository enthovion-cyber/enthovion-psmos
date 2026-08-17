import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewInspectionWorkOrderPage({ params }: { params: { inspectionId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Inspection', sourceRecordId: params.inspectionId }} />;
}
