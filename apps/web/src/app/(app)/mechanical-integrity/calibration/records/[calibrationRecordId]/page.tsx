import { CalibrationRecordDetailPage } from '@/features/mechanical-integrity/calibration/CalibrationRecordDetailPage';

export default function CalibrationRecordPage({ params }: { params: { calibrationRecordId: string } }) {
  return <CalibrationRecordDetailPage recordId={params.calibrationRecordId} />;
}

