import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';
export default function Page({ params }: { params: { equipmentId: string } }) { return <RegulatoryEvidenceRegisterPage initialFilters={{ equipmentId: params.equipmentId }} />; }
