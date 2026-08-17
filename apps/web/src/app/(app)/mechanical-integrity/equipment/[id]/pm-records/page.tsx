import { PmRecordRegistryPage } from '@/features/mechanical-integrity/preventive-maintenance/PmRecordRegistryPage';

export default function EquipmentPmRecordsPage({ params }: { params: { id: string } }) {
  return <PmRecordRegistryPage equipmentId={params.id} />;
}

