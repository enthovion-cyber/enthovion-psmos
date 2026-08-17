import { RegulatoryEvidenceRequestPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRequestPage';
export default function Page({ params }: { params: { requestId: string } }) { return <RegulatoryEvidenceRequestPage mode="detail" requestId={params.requestId} />; }
