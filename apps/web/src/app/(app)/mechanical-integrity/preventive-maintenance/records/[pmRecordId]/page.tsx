import { PmRecordDetailPage } from '@/features/mechanical-integrity/preventive-maintenance/PmRecordDetailPage';

export default function PmRecordPage({ params }: { params: { pmRecordId: string } }) {
  return <PmRecordDetailPage recordId={params.pmRecordId} />;
}

