'use client';

import { ReportStatusBadge } from '../shared/ReportStatusBadge';
import type { MiReportTemplate } from '../types/mi-report.types';

export function ReportTemplateTable({ rows = [] }: { rows?: MiReportTemplate[] | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Report Templates</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.12em] text-[var(--psm-muted)]">
            <tr><th className="py-2 pr-4">Template</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Formats</th><th className="py-2 pr-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pr-4 font-semibold">{row.template_name}<div className="text-xs font-normal text-[var(--psm-muted)]">{row.description ?? 'No description'}</div></td>
                <td className="py-3 pr-4">{row.report_category}</td>
                <td className="py-3 pr-4">{row.report_type}</td>
                <td className="py-3 pr-4">{(row.output_formats_json ?? []).join(', ') || 'Default'}</td>
                <td className="py-3 pr-4"><ReportStatusBadge status={row.active ? 'Active' : 'Archived'} /></td>
              </tr>
            )) : <tr><td colSpan={5} className="py-6 text-center text-[var(--psm-muted)]">No report templates found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
