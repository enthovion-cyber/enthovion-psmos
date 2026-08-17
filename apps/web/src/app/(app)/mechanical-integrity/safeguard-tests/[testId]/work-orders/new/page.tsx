import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewSafeguardTestWorkOrderPage({ params }: { params: { testId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Safeguard Test', sourceRecordId: params.testId }} />;
}
