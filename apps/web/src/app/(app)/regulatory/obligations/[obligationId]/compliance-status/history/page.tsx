import { RegulatoryComplianceHistoryPage } from '@/features/regulatory/compliance/RegulatoryComplianceHistoryPage';

export default function Page({ params }: { params: { obligationId: string } }) {
  return <RegulatoryComplianceHistoryPage title="Obligation Compliance History" initialFilters={{ obligationId: params.obligationId }} />;
}
