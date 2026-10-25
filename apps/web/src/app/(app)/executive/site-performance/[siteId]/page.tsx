import { ExecutiveDashboardPage } from '@/features/executive/ExecutiveDashboardPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page({ params }: { params: Promise<{ siteId: string }> }) { const { siteId } = await params; return <ExecutiveDashboardPage scope={{ siteId }} />; }
