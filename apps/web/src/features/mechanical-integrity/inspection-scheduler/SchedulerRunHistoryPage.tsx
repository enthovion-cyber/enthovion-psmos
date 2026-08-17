'use client';

import { useInspectionScheduler } from '../hooks/useInspectionScheduler';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { RunSchedulerDialog } from './RunSchedulerDialog';

export function SchedulerRunHistoryPage() {
  const scheduler = useInspectionScheduler();
  if (scheduler.runs.isLoading) return <MiLoadingSkeleton rows={5} />;
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-[var(--psm-text)]">Scheduler Runs</h1><p className="text-sm text-[var(--psm-muted)]">Run history, generated occurrences, and scheduler errors.</p></div><RunSchedulerDialog onRun={() => scheduler.run.mutate({})} running={scheduler.run.isPending} /></div><div className="grid gap-3">{scheduler.runs.data?.map((run) => <div key={String(run.id)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="font-bold text-[var(--psm-text)]">{String(run.status)}</div><div className="text-sm text-[var(--psm-muted)]">{String(run.started_at)} - {String(run.total_plans_evaluated ?? 0)} plans - {String(run.generated_occurrences_count ?? 0)} occurrences</div></div>)}</div></div>;
}
