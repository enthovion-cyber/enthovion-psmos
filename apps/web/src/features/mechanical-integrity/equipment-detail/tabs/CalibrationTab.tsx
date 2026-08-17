import { CalibrationPlanRegistryPage } from '../../calibration/CalibrationPlanRegistryPage';

export function CalibrationTab({ equipmentId }: { equipmentId: string }) {
  return <CalibrationPlanRegistryPage equipmentId={equipmentId} />;
}

