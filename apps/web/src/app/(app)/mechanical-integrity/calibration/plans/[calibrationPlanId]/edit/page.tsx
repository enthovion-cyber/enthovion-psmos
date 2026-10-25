import { CalibrationPlanFormPage } from '@/features/mechanical-integrity/calibration/CalibrationPlanFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EditCalibrationPlanPage(props: { params: Promise<{ calibrationPlanId: string }> }) {
  const params = await props.params;
  return <CalibrationPlanFormPage planId={params.calibrationPlanId} />;
}

