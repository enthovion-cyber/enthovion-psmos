import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ executionId: string }> }) {
  const params = await props.params;
  return <AuditEvidenceSourcePage sourcePath={`execution/${params.executionId}`} title="Audit Execution Evidence" />;
}
