import { BillingLayout } from '@/features/billing/BillingLayout';
import { InvoicesTable } from '@/features/billing/InvoicesTable';

export default function Page() {
  return <BillingLayout><InvoicesTable /></BillingLayout>;
}
