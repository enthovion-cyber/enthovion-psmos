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
    <section className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Isolation / LOTO Summary</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusPill value={summary?.status ?? 'Planned'} />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Authority: {summary?.isolationAuthority ?? '-'}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Updated: {summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
          </div>
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2 xl:max-w-[720px] xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400"><Icon size={13} />{item.label}</div>
                <div className={`mt-1 text-xl font-bold font-mono tracking-tight ${item.tone}`}>{item.value}</div>
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
