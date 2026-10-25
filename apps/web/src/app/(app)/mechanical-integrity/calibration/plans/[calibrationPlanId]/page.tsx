import { CalibrationPlanDetailPage } from '@/features/mechanical-integrity/calibration/CalibrationPlanDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function CalibrationPlanPage(props: { params: Promise<{ calibrationPlanId: string }> }) {
  const params = await props.params;
  return <CalibrationPlanDetailPage planId={params.calibrationPlanId} />;
}

