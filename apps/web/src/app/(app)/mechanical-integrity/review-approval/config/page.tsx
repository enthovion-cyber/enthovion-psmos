import { ApprovalRuleConfigPage } from '@/features/mechanical-integrity/review-approval/config/ApprovalRuleConfigPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function MechanicalIntegrityApprovalConfigPage() {
  return <ApprovalRuleConfigPage />;
}
