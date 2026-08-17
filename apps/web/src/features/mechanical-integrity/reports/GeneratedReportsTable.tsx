'use client';

import { ExportFormatBadge } from '../shared/ExportFormatBadge';
import { ReportStatusBadge } from '../shared/ReportStatusBadge';
import type { MiGeneratedReport } from '../types/mi-report.types';

export function GeneratedReportsTable({ rows = [] }: { rows?: MiGeneratedReport[] | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Generated Reports</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.12em] text-[var(--psm-muted)]">
            <tr><th className="py-2 pr-4">Report</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Format</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Generated</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pr-4 font-semibold">{row.report_number}<div className="text-xs font-normal text-[var(--psm-muted)]">{row.report_title}</div></td>
                <td className="py-3 pr-4">{row.report_category}</td>
                <td className="py-3 pr-4"><ExportFormatBadge format={row.output_format} /></td>
                <td className="py-3 pr-4"><ReportStatusBadge status={row.status} /></td>
                <td className="py-3 pr-4">{row.generated_at ? new Date(row.generated_at).toLocaleString() : 'Pending'}</td>
              </tr>
            )) : <tr><td colSpan={5} className="py-6 text-center text-[var(--psm-muted)]">No generated reports yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
