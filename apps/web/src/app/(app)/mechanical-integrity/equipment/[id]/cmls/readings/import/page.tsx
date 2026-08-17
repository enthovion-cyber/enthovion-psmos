import { InspectionRecordRegistryPage } from '@/features/mechanical-integrity/inspection-records/InspectionRecordRegistryPage';

export default function EquipmentUtImportPage({ params }: { params: { id: string } }) {
  return <InspectionRecordRegistryPage equipmentId={params.id} />;
}
