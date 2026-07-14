import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ConflictSummary } from '../../services/ptw-conflict.service';

export function ConflictSummaryCard({ summary }: { summary?: ConflictSummary | undefined }) {
  const metrics = [
    { label: 'Total', value: summary?.total ?? 0, tone: 'text-[var(--psm-text)]' },
    { label: 'Open', value: summary?.open ?? 0, tone: 'text-warning' },
    { label: 'Overridden', value: summary?.overridden ?? 0, tone: 'text-primary' },
    { label: 'Resolved', value: summary?.resolved ?? 0, tone: 'text-success' },
    { label: 'Critical', value: summary?.critical ?? 0, tone: 'text-danger' },
    { label: 'High', value: summary?.high ?? 0, tone: 'text-warning' }
  ];
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><ShieldAlert size={16} /> Conflict Summary</div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${summary?.activationBlocked ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{summary?.overallStatus ?? 'Not Checked'}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">{metrics.map((metric) => <div key={metric.label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{metric.label}</div><div className={`mt-1 text-2xl font-semibold ${metric.tone}`}>{metric.value}</div></div>)}</div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--psm-muted)]"><span>Last checked: {summary?.lastCheckedAt ? new Date(summary.lastCheckedAt).toLocaleString() : 'Never'}</span><span>By: {summary?.lastCheckedBy ?? '-'}</span></div>
      {!summary?.activationBlocked ? <p className="mt-3 text-sm text-success"><CheckCircle2 size={15} className="mr-1 inline" />No high-risk activation blocker from conflicts.</p> : <p className="mt-3 text-sm text-danger"><AlertTriangle size={15} className="mr-1 inline" />Conflict controls require action before activation.</p>}
    </section>
  );
}
