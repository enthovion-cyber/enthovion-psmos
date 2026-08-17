import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewReliefTestWorkOrderPage({ params }: { params: { testId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Relief Device Test', sourceRecordId: params.testId }} />;
}
