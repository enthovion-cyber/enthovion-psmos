import { BillingLayout } from '@/features/billing/BillingLayout';
import { PaymentMethodPanel } from '@/features/billing/PaymentMethodPanel';

export default function Page() {
  return <BillingLayout><PaymentMethodPanel /></BillingLayout>;
}
