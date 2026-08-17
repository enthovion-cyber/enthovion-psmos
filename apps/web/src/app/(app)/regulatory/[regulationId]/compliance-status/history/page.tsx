import { RegulatoryComplianceHistoryPage } from '@/features/regulatory/compliance/RegulatoryComplianceHistoryPage';

export default function Page({ params }: { params: { regulationId: string } }) {
  return <RegulatoryComplianceHistoryPage title="Requirement Compliance History" initialFilters={{ regulatoryItemId: params.regulationId }} />;
}
