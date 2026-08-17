import Link from 'next/link';
import type { MiEquipmentBlocker } from '../../types/equipment.types';

const severityClass: Record<string, string> = {
  Critical: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200',
  High: 'border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-200',
  Medium: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  Low: 'border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-200'
};

export function EquipmentOpenBlockersCard({ blockers = [] }: { blockers?: MiEquipmentBlocker[] | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 xl:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Open Blockers / Next Steps</h2>
        <span className="text-xs text-[var(--psm-muted)]">{blockers.length} blocker{blockers.length === 1 ? '' : 's'}</span>
      </div>
      {blockers.length === 0 ? (
        <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-200">No backend-generated blockers are currently open for this equipment.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {blockers.map((blocker) => (
            <article key={blocker.id} className="rounded-lg border border-[var(--psm-line)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass[blocker.severity] ?? severityClass.Low}`}>{blocker.severity}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{blocker.sourceSection}</span>
              </div>
              <h3 className="mt-2 font-semibold">{blocker.reason}</h3>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{blocker.recommendedNextAction}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--psm-muted)]">
                <span>Owner: {blocker.owner ?? '-'}</span>
                <span>Due: {blocker.dueDate ? new Date(blocker.dueDate).toLocaleDateString() : '-'}</span>
                <Link className="text-primary hover:underline" href={blocker.href}>Open source</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
