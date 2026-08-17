import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryEvidenceRegisterPage initialFilters={{ regulatoryItemId: params.regulationId }} />; }
