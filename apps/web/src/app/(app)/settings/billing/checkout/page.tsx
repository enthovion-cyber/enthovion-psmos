'use client';

import { BillingLayout } from '@/features/billing/BillingLayout';
import { PlanComparisonTable } from '@/features/billing/PlanComparisonTable';
import { usePlans } from '@/features/billing/hooks/usePlans';

export default function Page() {
  const plans = usePlans();
  return <BillingLayout><PlanComparisonTable plans={plans.data ?? []} /></BillingLayout>;
}
