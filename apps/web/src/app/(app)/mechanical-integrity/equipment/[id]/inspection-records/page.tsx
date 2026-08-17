import { InspectionRecordRegistryPage } from '@/features/mechanical-integrity/inspection-records/InspectionRecordRegistryPage';

export default function EquipmentInspectionRecordsPage({ params }: { params: { id: string } }) {
  return <InspectionRecordRegistryPage equipmentId={params.id} />;
}
