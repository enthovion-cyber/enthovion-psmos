import { ExecutiveKpiDetailPage } from '@/features/executive/kpis/ExecutiveKpiDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(
  props: { params: Promise<{ kpiId: string; view: 'overview' | 'source-trace' | 'drilldown' }> }
) {
  const params = await props.params;
  return <ExecutiveKpiDetailPage id={params.kpiId} view={params.view} />;
}
