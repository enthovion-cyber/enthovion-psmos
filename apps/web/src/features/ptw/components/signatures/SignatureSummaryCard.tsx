import { AlertTriangle, CheckCircle2, Clock, FileSignature, ShieldAlert } from 'lucide-react';
import type { SignatureSummary } from '../../services/ptw-signature.service';

export function SignatureSummaryCard({ summary, loading = false }: { summary?: SignatureSummary | undefined; loading?: boolean }) {
  const items = [
    { label: 'Required', value: summary?.totalRequired ?? 0, icon: FileSignature, tone: 'text-primary' },
    { label: 'Completed', value: summary?.completed ?? 0, icon: CheckCircle2, tone: 'text-success' },
    { label: 'Pending', value: summary?.pending ?? 0, icon: Clock, tone: 'text-warning' },
    { label: 'Rejected', value: summary?.rejected ?? 0, icon: ShieldAlert, tone: 'text-danger' }
  ];
  return (
    <section className="psm-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><FileSignature size={17} /> Signature Summary</div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Electronic signatures required for PTW lifecycle control.</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${summary?.lifecycleBlocked ? 'border-warning/40 bg-warning/10 text-warning' : 'border-success/40 bg-success/10 text-success'}`}>
          {loading ? 'Loading' : summary?.status ?? 'Not Required'}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {items.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${tone}`}><Icon size={15} /> {label}</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? '-' : value}</div>
        </div>)}
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--psm-muted)]"><span>Completion</span><span>{summary?.completionPercent ?? 0}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--psm-surface-2)]"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${summary?.completionPercent ?? 0}%` }} /></div>
      </div>
      {summary?.lifecycleBlocked ? <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning"><AlertTriangle size={16} className="mt-0.5" /> This permit has signature blockers before the next lifecycle step.</div> : null}
    </section>
  );
}
