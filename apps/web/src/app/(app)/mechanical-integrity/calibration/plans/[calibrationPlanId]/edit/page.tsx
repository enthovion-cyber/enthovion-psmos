import { CalibrationPlanFormPage } from '@/features/mechanical-integrity/calibration/CalibrationPlanFormPage';

export default function EditCalibrationPlanPage({ params }: { params: { calibrationPlanId: string } }) {
  return <CalibrationPlanFormPage planId={params.calibrationPlanId} />;
}

