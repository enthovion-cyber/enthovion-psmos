import { RegulatoryTrendRunRegisterPage } from '@/features/regulatory/trends/RegulatoryTrendRunPages';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const trendTypes: Record<string, string> = {
  'compliance-status': 'Compliance Status Trend', obligations: 'Obligation Overdue Trend', evidence: 'Evidence Readiness Trend', gaps: 'Compliance Gap Trend', 'actions-capa': 'Action / CAPA Overdue Trend', 'audit-mapping': 'Audit Mapping Coverage Trend', 'review-approval': 'Review Approval Cycle Trend', reports: 'Report Staleness Trend', changes: 'Regulatory Change Impact Trend', 'stale-records': 'Report Staleness Trend'
};

export default async function Page(props: { params: Promise<{ trendType: string }> }) {
  const params = await props.params;
  const trendType = trendTypes[params.trendType] ?? 'Custom';
  return <RegulatoryTrendRunRegisterPage trendType={trendType} title={`${params.trendType.replace(/-/g, ' ')} trends`} />;
}
