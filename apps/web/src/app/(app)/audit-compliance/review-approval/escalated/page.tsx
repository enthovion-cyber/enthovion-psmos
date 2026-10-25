import { AuditApprovalListPage } from "@/features/audit/review/AuditApprovalListPage";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() { return <AuditApprovalListPage view="escalated" title="Escalated Approvals" subtitle="Packages escalated through backend SLA and review governance." />; }
