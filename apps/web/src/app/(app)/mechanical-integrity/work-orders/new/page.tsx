import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewWorkOrderPage({ searchParams }: { searchParams?: { equipmentId?: string; sourceModule?: string; sourceRecordId?: string; linkedDeficiencyId?: string } }) {
  return <WorkOrderFormPage preset={searchParams ?? {}} />;
}
