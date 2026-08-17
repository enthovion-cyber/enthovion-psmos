'use client';

export function RunSchedulerDialog({ onRun, running }: { onRun: () => void; running?: boolean }) {
  return <button type="button" onClick={onRun} disabled={running} className="rounded-lg bg-info px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{running ? 'Running scheduler...' : 'Run Scheduler'}</button>;
}
