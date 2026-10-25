import { AuditApprovalListPage } from "@/features/audit/review/AuditApprovalListPage";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() { return <AuditApprovalListPage view="my-submissions" title="My Submissions" subtitle="Approval packages submitted by you, including returned, rejected, stale, and completed packages." />; }
