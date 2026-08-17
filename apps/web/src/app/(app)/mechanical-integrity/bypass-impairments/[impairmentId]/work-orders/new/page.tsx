import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewImpairmentWorkOrderPage({ params }: { params: { impairmentId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Bypass / Impairment', sourceRecordId: params.impairmentId }} />;
}
