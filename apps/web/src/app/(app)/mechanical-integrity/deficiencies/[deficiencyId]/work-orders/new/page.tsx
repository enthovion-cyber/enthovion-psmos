import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewDeficiencyWorkOrderPage({ params }: { params: { deficiencyId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Deficiency', sourceRecordId: params.deficiencyId, linkedDeficiencyId: params.deficiencyId }} />;
}
