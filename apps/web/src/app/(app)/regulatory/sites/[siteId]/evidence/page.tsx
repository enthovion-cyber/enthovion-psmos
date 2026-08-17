import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';
export default function Page({ params }: { params: { siteId: string } }) { return <RegulatoryEvidenceRegisterPage initialFilters={{ siteId: params.siteId }} />; }
