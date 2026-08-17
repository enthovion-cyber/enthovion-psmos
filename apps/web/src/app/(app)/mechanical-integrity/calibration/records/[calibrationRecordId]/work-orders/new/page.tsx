import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

export default function MechanicalIntegrityNewCalibrationWorkOrderPage({ params }: { params: { calibrationRecordId: string } }) {
  return <WorkOrderFormPage preset={{ sourceModule: 'Calibration', sourceRecordId: params.calibrationRecordId }} />;
}
