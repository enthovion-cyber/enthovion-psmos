import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { HandoverReadiness } from '../../services/ptw-handover.service';

export function PermitRiskReviewCard({ readiness, permit }: { readiness?: HandoverReadiness | undefined; permit: any }) {
  const risks = Array.isArray(readiness?.permit.activeRisks) ? readiness?.permit.activeRisks : [];
  const controls = Array.isArray(readiness?.permit.requiredControls) ? readiness?.permit.requiredControls : [];
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><ShieldAlert size={16} /> Permit Risk Review</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Info label="Risk Level" value={String(readiness?.permit.riskLevel ?? permit.risk_level ?? '-')} tone={(readiness?.permit.riskLevel ?? permit.risk_level) === 'High' ? 'danger' : 'warning'} />
        <Info label="Permit Type" value={String(readiness?.permit.permitType ?? permit.permit_type ?? '-')} />
        <Info label="SIMOPS / Conflict" value={readiness?.conflicts.status ?? 'Not checked'} tone={readiness?.conflicts.openCount ? 'danger' : 'success'} />
        <Info label="Safety Critical" value={readiness?.permit.safetyCritical ? 'Yes' : 'No'} tone={readiness?.permit.safetyCritical ? 'danger' : 'success'} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <List title="Active Risks" items={risks} icon={<AlertTriangle size={14} />} />
        <List title="Required Controls" items={controls} icon={<ShieldAlert size={14} />} />
      </div>
    </section>
  );
}

function Info({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : '';
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className={`mt-1 text-sm font-semibold ${color}`}>{value}</div></div>;
}

function List({ title, items, icon }: { title: string; items: unknown[]; icon: ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--psm-muted)]">{icon}{title}</div>{items.length ? <ul className="space-y-1 text-sm">{items.slice(0, 5).map((item, index) => <li key={index}>{String(item)}</li>)}</ul> : <div className="text-sm text-[var(--psm-muted)]">No items recorded.</div>}</div>;
}
