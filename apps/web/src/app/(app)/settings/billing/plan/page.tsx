'use client';

import { BillingLayout } from '@/features/billing/BillingLayout';
import { PlanComparisonTable } from '@/features/billing/PlanComparisonTable';
import { useBillingOverview } from '@/features/billing/hooks/useBillingOverview';
import { usePlans } from '@/features/billing/hooks/usePlans';

export default function Page() {
  const overview = useBillingOverview();
  const plans = usePlans();
  const currentPlanId = overview.data?.subscription?.plan_id;
  return <BillingLayout><div className="space-y-4"><PlanComparisonTable plans={plans.data ?? []} {...(currentPlanId ? { currentPlanId } : {})} /></div></BillingLayout>;
}
