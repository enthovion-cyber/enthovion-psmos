import { useState } from 'react';
import Link from 'next/link';

export function HazopRevalidationDuePanel({ studies }: { studies: any[] }) {
  return <ListPanel title="Revalidation Due" rows={studies} empty="No revalidation dates in the watch window." render={(study) => <StudyRow study={study} meta={study.revalidation_due_date ?? '-'} tone="text-cyan-600 dark:text-cyan-400" />} />;
}

export function HazopOverdueStudiesPanel({ studies }: { studies: any[] }) {
  return <ListPanel title="Overdue Studies" rows={studies} empty="No overdue studies." render={(study) => <StudyRow study={study} meta={`${daysOverdue(study.target_completion_date)} days`} tone="text-rose-600 dark:text-rose-400" />} />;
}

export function HazopComplianceWatchPanel({ overdueStudies = [], revalidationStudies = [] }: { overdueStudies: any[]; revalidationStudies: any[] }) {
  const [tab, setTab] = useState<'overdue' | 'revalidation'>('overdue');
  const activeRows = tab === 'overdue' ? overdueStudies : revalidationStudies;

  return (
    <section className="h-[270px] flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 shadow-sm">
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="mb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab('overdue')}
              className={`rounded-md px-2 py-0.5 font-semibold transition ${
                tab === 'overdue' 
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30' 
                  : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
              }`}
            >
              Overdue ({overdueStudies.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('revalidation')}
              className={`rounded-md px-2 py-0.5 font-semibold transition ${
                tab === 'revalidation' 
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30' 
                  : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
              }`}
            >
              Revalidation ({revalidationStudies.length})
            </button>
          </div>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</span>
        </div>

        <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1 flex-1">
          {activeRows.slice(0, 6).map((study) => (
            <Link 
              key={study.id} 
              href={`/hazop/${study.id}`} 
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5 hover:bg-[var(--psm-surface-2)] transition"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--psm-text)]">{study.study_number}</span>
                <span className="block truncate text-[11px] text-[var(--psm-muted)]">{study.title}</span>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold shrink-0 border ${
                tab === 'overdue' 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400' 
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
              }`}>
                {tab === 'overdue' ? `${daysOverdue(study.target_completion_date)}d overdue` : (study.revalidation_due_date ? new Date(study.revalidation_due_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Due')}
              </span>
            </Link>
          ))}
          {!activeRows.length && (
            <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-xs text-[var(--psm-muted)]">
              {tab === 'overdue' ? 'No overdue PHA studies.' : 'No studies nearing 5-year revalidation.'}
            </div>
          )}
        </div>
      </div>
      <div className="pt-2 text-[10px] text-[var(--psm-muted)] border-t border-[var(--psm-line)] shrink-0">
        OSHA 1910.119(e)(6) 5-year revalidation cycle
      </div>
    </section>
  );
}

function ListPanel({ title, rows, empty, render }: { title: string; rows: any[]; empty: string; render: (row: any) => any }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-[var(--psm-text)]">{title}</h3>
        <span className="text-xs text-blue-600 dark:text-blue-400">View all</span>
      </div>
      <div className="space-y-2">
        {rows.length ? rows.slice(0, 6).map((row) => <div key={row.id}>{render(row)}</div>) : <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-xs text-[var(--psm-muted)]">{empty}</div>}
      </div>
    </section>
  );
}

function StudyRow({ study, meta, tone }: { study: any; meta: string; tone: string }) {
  return (
    <Link href={`/hazop/${study.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-2.5 hover:bg-[var(--psm-surface-2)] transition">
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-[var(--psm-text)]">{study.study_number}</span>
        <span className="block truncate text-[11px] text-[var(--psm-muted)]">{study.title}</span>
      </span>
      <b className={`text-xs font-bold ${tone}`}>{meta}</b>
    </Link>
  );
}

function daysOverdue(date?: string | null) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(date).getTime()) / 86400000));
}
