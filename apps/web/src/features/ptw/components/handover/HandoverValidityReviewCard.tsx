import { Activity } from 'lucide-react';
import type { HandoverReadiness } from '../../services/ptw-handover.service';

export function HandoverValidityReviewCard({ readiness }: { readiness?: HandoverReadiness | undefined }) {
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Activity size={16} /> Validity Review</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Isolation Status" value={readiness?.isolation.status ?? 'Loading'} tone={readiness?.isolation.complete ? 'success' : 'warning'} />
        <Info label="De-isolation Status" value={readiness?.isolation.deIsolationStatus ?? '-'} />
        <Info label="Gas Test Status" value={readiness?.gasTest.status ?? '-'} tone={readiness?.gasTest.overdue ? 'danger' : readiness?.gasTest.dueSoon ? 'warning' : 'success'} />
        <Info label="Next Gas Retest Due" value={readiness?.gasTest.nextDueAt ? new Date(readiness.gasTest.nextDueAt).toLocaleString() : '-'} />
        <Info label="Workforce Briefing" value={readiness?.workforce.briefingStatus ?? '-'} />
        <Info label="Workers Signed In" value={String(readiness?.workforce.signedInCount ?? 0)} tone={readiness?.workforce.signedInCount ? 'warning' : 'success'} />
        <Info label="Required Signatures" value={readiness?.signatures.complete ? 'Complete' : 'Incomplete'} tone={readiness?.signatures.complete ? 'success' : 'warning'} />
      </div>
    </section>
  );
}

function Info({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : '';
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className={`mt-1 text-sm font-semibold ${color}`}>{value}</div></div>;
}
