import { CalibrationPlanDetailPage } from '@/features/mechanical-integrity/calibration/CalibrationPlanDetailPage';

export default function CalibrationPlanPage({ params }: { params: { calibrationPlanId: string } }) {
  return <CalibrationPlanDetailPage planId={params.calibrationPlanId} />;
}

