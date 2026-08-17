'use client';

import { ExportFormatBadge } from '../shared/ExportFormatBadge';
import { ExportStatusBadge } from '../shared/ExportStatusBadge';
import type { MiExportJob } from '../types/mi-export.types';

export function ExportJobsTable({ rows = [], onCancel }: { rows?: MiExportJob[] | undefined; onCancel?: ((id: string) => void) | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Export Jobs</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.12em] text-[var(--psm-muted)]">
            <tr><th className="py-2 pr-4">Job</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Format</th><th className="py-2 pr-4">Scope</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pr-4 font-semibold">{row.export_number}<div className="text-xs font-normal text-[var(--psm-muted)]">{new Date(row.requested_at).toLocaleString()}</div></td>
                <td className="py-3 pr-4">{row.export_type}</td>
                <td className="py-3 pr-4"><ExportFormatBadge format={row.output_format} /></td>
                <td className="py-3 pr-4">{row.scope_type}</td>
                <td className="py-3 pr-4"><ExportStatusBadge status={row.status} /></td>
                <td className="py-3 pr-4">
                  <button type="button" disabled={!/queued|running/i.test(row.status)} onClick={() => onCancel?.(row.id)} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs disabled:opacity-50" title={!/queued|running/i.test(row.status) ? 'Only queued/running jobs can be cancelled.' : undefined}>Cancel</button>
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="py-6 text-center text-[var(--psm-muted)]">No export jobs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
