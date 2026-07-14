import type { CompanyEntitlement } from './types/entitlement.types';
import { EntitlementStatusBadge } from './EntitlementStatusBadge';

export function ModuleEntitlementGrid({ entitlements }: { entitlements: CompanyEntitlement[] }) {
  const modules = entitlements.filter((item) => item.entitlement_type === 'module');
  return <div className="psm-panel rounded-xl p-5"><h2 className="text-lg font-semibold">Module entitlements</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{modules.map((item) => <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium">{item.entitlement_key.replace('module.', '')}</span><EntitlementStatusBadge enabled={item.enabled} /></div><p className="mt-2 text-xs text-[var(--psm-muted)]">{String(item.config_json?.disabledReason ?? item.config_json?.upgradeMessage ?? 'Plan entitlement controlled by backend.')}</p></div>)}</div></div>;
}
