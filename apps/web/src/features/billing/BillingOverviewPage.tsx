'use client';

import { BillingAuditTimeline } from './BillingAuditTimeline';
import { BillingLayout } from './BillingLayout';
import { BillingSummaryCards } from './BillingSummaryCards';
import { CurrentPlanCard } from './CurrentPlanCard';
import { GracePeriodBanner } from './GracePeriodBanner';
import { ModuleEntitlementGrid } from './ModuleEntitlementGrid';
import { PaymentFailedBanner } from './PaymentFailedBanner';
import { ReadOnlyModeBanner } from './ReadOnlyModeBanner';
import { SubscriptionStatusBanner } from './SubscriptionStatusBanner';
import { TrialBanner } from './TrialBanner';
import { UsageDashboard } from './UsageDashboard';
import { InvoicesTable } from './InvoicesTable';
import { useBillingOverview } from './hooks/useBillingOverview';

export function BillingOverviewPage() {
  const query = useBillingOverview();
  if (query.isLoading) return <BillingLayout><div className="psm-panel rounded-xl p-6">Loading billing overview...</div></BillingLayout>;
  if (query.isError) return <BillingLayout><div className="psm-panel rounded-xl border border-danger/40 p-6 text-danger">Billing overview could not be loaded. Check billing permissions and company context.</div></BillingLayout>;
  const overview = query.data;
  if (!overview) return <BillingLayout><div className="psm-panel rounded-xl p-6">No billing data available.</div></BillingLayout>;
  return <BillingLayout><div className="space-y-4"><SubscriptionStatusBanner overview={overview} /><TrialBanner subscription={overview.subscription} /><PaymentFailedBanner subscription={overview.subscription} /><GracePeriodBanner subscription={overview.subscription} /><ReadOnlyModeBanner subscription={overview.subscription} /><BillingSummaryCards overview={overview} /><CurrentPlanCard overview={overview} /><UsageDashboard /><ModuleEntitlementGrid entitlements={overview.entitlements} /><InvoicesTable /><BillingAuditTimeline events={overview.audit} /></div></BillingLayout>;
}
