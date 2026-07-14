'use client';

import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { CompanyBillingAdminDrawer } from './CompanyBillingAdminDrawer';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export function PlatformCompaniesBillingPage() {
  const query = useQuery({ queryKey: ['platform', 'billing', 'companies'], queryFn: () => api.get('/platform/billing/companies').then(unwrap<any[]>) });
  return <section className="space-y-5 p-4 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Platform billing</p><h1 className="text-2xl font-semibold">Companies</h1></div><div className="psm-panel overflow-hidden rounded-xl"><table className="w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left"><tr><th className="p-3">Company</th><th className="p-3">Status</th><th className="p-3">Access</th><th className="p-3">Actions</th></tr></thead><tbody>{(query.data ?? []).map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3">{row.company?.name ?? row.company_id}</td><td className="p-3">{row.status}</td><td className="p-3">{row.access_mode}</td><td className="p-3"><CompanyBillingAdminDrawer companyId={row.company_id} /></td></tr>)}</tbody></table></div></section>;
}
