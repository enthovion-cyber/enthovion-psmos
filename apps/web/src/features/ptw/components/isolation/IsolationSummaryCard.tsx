import { Activity, CheckCircle2, LockKeyhole, ShieldCheck, UnlockKeyhole } from 'lucide-react';
import type { PermitIsolationSummary } from '../../services/ptw-isolation.service';

export function IsolationSummaryCard({ summary }: { summary?: PermitIsolationSummary | undefined }) {
  const items = [
    { label: 'Isolation Required', value: summary?.isolationRequired ? 'Yes' : 'No', icon: LockKeyhole, tone: summary?.isolationRequired ? 'text-warning' : 'text-[var(--psm-muted)]' },
    { label: 'Total Points', value: String(summary?.total ?? 0), icon: Activity, tone: 'text-primary' },
    { label: 'Confirmed', value: String(summary?.confirmed ?? 0), icon: CheckCircle2, tone: 'text-success' },
    { label: 'Verified', value: String(summary?.verified ?? 0), icon: ShieldCheck, tone: 'text-success' },
    { label: 'Isolation Complete', value: `${summary?.completionPercent ?? 0}%`, icon: LockKeyhole, tone: 'text-success' },
    { label: 'De-Isolation Complete', value: `${summary?.deIsolationPercent ?? 0}%`, icon: UnlockKeyhole, tone: 'text-warning' }
  ];

  return (
    <section className="psm-card p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Isolation / LOTO Summary</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill value={summary?.status ?? 'Planned'} />
            <span className="text-xs text-[var(--psm-muted)]">Authority: {summary?.isolationAuthority ?? '-'}</span>
            <span className="text-xs text-[var(--psm-muted)]">Last updated: {summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString() : '-'}</span>
          </div>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[760px] xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <div className="flex items-center gap-2 text-xs uppercase text-[var(--psm-muted)]"><Icon size={15} />{item.label}</div>
                <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ value }: { value: string }) {
  const cls = value === 'Fully Isolated' || value === 'De-Isolated' ? 'border-success/40 bg-success/10 text-success' : value === 'In Progress' || value === 'Partially De-Isolated' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{value}</span>;
}
