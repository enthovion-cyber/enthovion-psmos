'use client';

import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { PlanEditor } from './PlanEditor';
import { PlanEntitlementEditor } from './PlanEntitlementEditor';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export function PlatformPlansPage() {
  const query = useQuery({ queryKey: ['platform', 'billing', 'plans'], queryFn: () => api.get('/platform/billing/plans').then(unwrap<any[]>) });
  return <section className="space-y-5 p-4 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Platform billing</p><h1 className="text-2xl font-semibold">Plans</h1></div><PlanEditor /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(query.data ?? []).map((plan) => <div key={plan.id} className="psm-panel rounded-xl p-5"><h2 className="text-lg font-semibold">{plan.name}</h2><p className="text-sm text-[var(--psm-muted)]">{plan.code} · {plan.status}</p><PlanEntitlementEditor planId={plan.id} /></div>)}</div></section>;
}
