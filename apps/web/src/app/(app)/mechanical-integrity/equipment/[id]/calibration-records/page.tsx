import { CalibrationRecordRegistryPage } from '@/features/mechanical-integrity/calibration/CalibrationRecordRegistryPage';

export default function EquipmentCalibrationRecordsPage({ params }: { params: { id: string } }) {
  return <CalibrationRecordRegistryPage equipmentId={params.id} />;
}

