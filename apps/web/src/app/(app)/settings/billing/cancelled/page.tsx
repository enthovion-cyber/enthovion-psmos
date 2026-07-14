import { BillingLayout } from '@/features/billing/BillingLayout';

export default function Page() {
  return <BillingLayout><div className="psm-panel rounded-xl p-6">Checkout was cancelled. No subscription change is trusted until the backend receives provider confirmation.</div></BillingLayout>;
}
