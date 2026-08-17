import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';
export default function Page({ params }: { params: { unitId: string } }) { return <RegulatoryEvidenceRegisterPage initialFilters={{ unitId: params.unitId }} />; }
