import { ExecutivePerformanceScopePage } from '@/features/executive/performance/ExecutivePerformancePages';

export const instant = false;

export default async function Page(props: { params: Promise<{ siteId: string }> }) {
  const params = await props.params;
  return <ExecutivePerformanceScopePage type="site" id={params.siteId} />;
}
