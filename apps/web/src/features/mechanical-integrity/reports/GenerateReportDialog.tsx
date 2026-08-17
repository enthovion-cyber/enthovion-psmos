'use client';

import { useState } from 'react';
import { useReportGeneration } from '../hooks/useReportGeneration';

export function GenerateReportDialog({ reportType }: { reportType?: string | undefined }) {
  const [title, setTitle] = useState(reportType ?? '');
  const [format, setFormat] = useState('pdf');
  const generation = useReportGeneration();

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Generate Report</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Report title or type" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm" />
        <select value={format} onChange={(event) => setFormat(event.target.value)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm">
          <option value="pdf">PDF</option><option value="xlsx">Excel</option><option value="csv">CSV</option><option value="json">JSON</option>
        </select>
        <button
          type="button"
          disabled={!title || generation.isPending}
          title={!title ? 'Enter a report title or type before generating.' : undefined}
          onClick={() => generation.mutate({ reportType: title, reportTitle: title, outputFormat: format })}
          className="rounded-lg bg-[var(--psm-accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generation.isPending ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {generation.error ? <p className="mt-3 text-sm text-red-600">Report generation failed. Check permissions and backend report configuration.</p> : null}
      {generation.data ? <p className="mt-3 text-sm text-emerald-600">Report queued/generated: {generation.data.row.report_number}</p> : null}
    </section>
  );
}
