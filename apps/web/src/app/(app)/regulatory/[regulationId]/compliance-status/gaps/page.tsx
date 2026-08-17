import { RegulatoryComplianceGapPage } from '@/features/regulatory/compliance/RegulatoryComplianceGapPage';

export default function Page({ params }: { params: { regulationId: string } }) {
  return <RegulatoryComplianceGapPage initialFilters={{ regulatoryItemId: params.regulationId }} />;
}
