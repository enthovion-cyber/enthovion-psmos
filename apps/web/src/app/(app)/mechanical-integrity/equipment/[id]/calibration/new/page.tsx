import { CalibrationPlanFormPage } from '@/features/mechanical-integrity/calibration/CalibrationPlanFormPage';

export default function NewEquipmentCalibrationPlanPage({ params }: { params: { id: string } }) {
  return <CalibrationPlanFormPage equipmentId={params.id} />;
}

