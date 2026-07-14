'use client';

import { useBillingMutations } from './hooks/useBillingMutations';
import { usePaymentMethods } from './hooks/usePaymentMethods';

export function PaymentMethodPanel() {
  const query = usePaymentMethods();
  const mutations = useBillingMutations();
  async function portal() {
    const result = await mutations.customerPortal.mutateAsync();
    window.location.href = result.portalUrl;
  }
  return <div className="psm-panel rounded-xl p-5"><div className="flex justify-between gap-3"><div><h2 className="text-lg font-semibold">Payment methods</h2><p className="text-sm text-[var(--psm-muted)]">Cards are managed through the provider portal. No card data is stored in PSM OS.</p></div><button className="psm-button psm-button-primary" onClick={() => void portal()}>Manage safely</button></div><div className="mt-4 space-y-3">{query.isLoading ? <div>Loading...</div> : null}{(query.data ?? []).length === 0 ? <div className="rounded-lg border border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">No payment method summary is available yet.</div> : null}{(query.data ?? []).map((method) => <div key={method.id} className="rounded-lg border border-[var(--psm-line)] p-4"><div className="font-medium">{method.brand ?? method.type} {method.last4 ? `ending ${method.last4}` : ''}</div><div className="text-xs text-[var(--psm-muted)]">{method.status} {method.is_default ? '· Default' : ''}</div></div>)}</div></div>;
}
