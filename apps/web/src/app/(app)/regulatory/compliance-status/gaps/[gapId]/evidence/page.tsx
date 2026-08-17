import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';

export default function ComplianceGapEvidencePage({ params }: { params: { gapId: string } }) {
  return <RegulatoryEvidenceRegisterPage initialFilters={{ complianceGapId: params.gapId }} />;
}
