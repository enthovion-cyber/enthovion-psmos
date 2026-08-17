import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryEvidenceRegisterPage initialFilters={{ obligationId: params.obligationId }} />; }
