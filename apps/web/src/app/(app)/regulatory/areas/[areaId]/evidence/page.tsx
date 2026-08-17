import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';
export default function Page({ params }: { params: { areaId: string } }) { return <RegulatoryEvidenceRegisterPage initialFilters={{ areaId: params.areaId }} />; }
