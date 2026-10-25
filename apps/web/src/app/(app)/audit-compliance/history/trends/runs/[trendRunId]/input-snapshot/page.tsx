import { AuditTrendRunDetailPage } from '@/features/audit/history/AuditTrendRunDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ trendRunId: string }> }) {
  const params = await props.params;
  return <AuditTrendRunDetailPage trendRunId={params.trendRunId} activeTab="input-snapshot" />;
}
