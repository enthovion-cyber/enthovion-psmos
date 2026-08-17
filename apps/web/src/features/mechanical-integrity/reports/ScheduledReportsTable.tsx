'use client';

import { ReportStatusBadge } from '../shared/ReportStatusBadge';
import type { MiScheduledReport } from '../types/mi-report.types';

export function ScheduledReportsTable({ rows = [] }: { rows?: MiScheduledReport[] | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Scheduled Reports</h2>
      <div className="mt-4 space-y-2">
        {rows.length ? rows.map((row) => (
          <div key={row.id} className="grid gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm md:grid-cols-4">
            <span className="font-semibold">{row.schedule_name}</span>
            <span>{row.schedule_frequency}</span>
            <span>Next: {row.next_run_at ? new Date(row.next_run_at).toLocaleString() : 'Not scheduled'}</span>
            <ReportStatusBadge status={row.active ? 'Active' : 'Disabled'} />
          </div>
        )) : <p className="text-sm text-[var(--psm-muted)]">No scheduled reports configured.</p>}
      </div>
    </section>
  );
}
