import { CalibrationTab } from '@/features/mechanical-integrity/equipment-detail/tabs/CalibrationTab';

export default function EquipmentCalibrationPage({ params }: { params: { id: string } }) {
  return <CalibrationTab equipmentId={params.id} />;
}

