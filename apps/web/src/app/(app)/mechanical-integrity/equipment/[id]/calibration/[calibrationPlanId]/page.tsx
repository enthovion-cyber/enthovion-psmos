import { CalibrationPlanDetailPage } from '@/features/mechanical-integrity/calibration/CalibrationPlanDetailPage';

export default function EquipmentCalibrationPlanDetailPage({ params }: { params: { calibrationPlanId: string } }) {
  return <CalibrationPlanDetailPage planId={params.calibrationPlanId} />;
}

