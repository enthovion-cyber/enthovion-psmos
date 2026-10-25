import { AuditApprovalListPage } from "@/features/audit/review/AuditApprovalListPage";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() { return <AuditApprovalListPage view="rejected" title="Rejected Packages" subtitle="Rejected packages with required decision reasons and history traceability." />; }
