import { RegulatoryComplianceGapPage } from '@/features/regulatory/compliance/RegulatoryComplianceGapPage';

export default function Page({ params }: { params: { obligationId: string } }) {
  return <RegulatoryComplianceGapPage initialFilters={{ obligationId: params.obligationId }} />;
}
