import { InspectionRecordDetailPage } from '@/features/mechanical-integrity/inspection-records/detail/InspectionRecordDetailPage';

export default function MechanicalIntegrityInspectionFindingsPage({ params }: { params: { inspectionId: string } }) {
  return <InspectionRecordDetailPage inspectionId={params.inspectionId} />;
}
