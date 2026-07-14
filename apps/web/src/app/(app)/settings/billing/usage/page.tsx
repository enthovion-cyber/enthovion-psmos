import { BillingLayout } from '@/features/billing/BillingLayout';
import { UsageDashboard } from '@/features/billing/UsageDashboard';

export default function Page() {
  return <BillingLayout><UsageDashboard /></BillingLayout>;
}
