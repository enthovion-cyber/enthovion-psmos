import { BillingLayout } from '@/features/billing/BillingLayout';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
  return <BillingLayout><div className="psm-panel rounded-xl p-6">Checkout was cancelled. No subscription change is trusted until the backend receives provider confirmation.</div></BillingLayout>;
}
