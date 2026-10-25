import { AuditFindingDetailPage } from "@/features/audit/findings/AuditFindingDetailPage";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ findingId: string }> }) {
  const params = await props.params;
  return <AuditFindingDetailPage findingId={params.findingId} activeTab="overview" />;
}
