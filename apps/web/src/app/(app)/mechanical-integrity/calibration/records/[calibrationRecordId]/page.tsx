import { CalibrationRecordDetailPage } from '@/features/mechanical-integrity/calibration/CalibrationRecordDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function CalibrationRecordPage(props: { params: Promise<{ calibrationRecordId: string }> }) {
  const params = await props.params;
  return <CalibrationRecordDetailPage recordId={params.calibrationRecordId} />;
}

