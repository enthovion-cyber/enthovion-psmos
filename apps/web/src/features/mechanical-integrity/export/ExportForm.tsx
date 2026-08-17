'use client';

import { useState } from 'react';

type Props = {
  types?: string[] | undefined;
  formats?: string[] | undefined;
  saving?: boolean | undefined;
  onSubmit: (input: Record<string, unknown>) => void;
};

export function ExportForm({ types = [], formats = [], saving, onSubmit }: Props) {
  const [exportType, setExportType] = useState(types[0] ?? 'equipment');
  const [outputFormat, setOutputFormat] = useState(formats[0] ?? 'xlsx');
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeAudit, setIncludeAudit] = useState(false);

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Create Export Job</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm">Export type
          <select value={exportType} onChange={(event) => setExportType(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2">
            {(types.length ? types : ['equipment', 'history', 'reports']).map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm">Format
          <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2">
            {(formats.length ? formats : ['xlsx', 'csv', 'pdf', 'json', 'zip']).map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">
          <input type="checkbox" checked={includeDocuments} onChange={(event) => setIncludeDocuments(event.target.checked)} /> Include documents
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">
          <input type="checkbox" checked={includeAudit} onChange={(event) => setIncludeAudit(event.target.checked)} /> Include audit
        </label>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => onSubmit({ exportType, outputFormat, includeDocuments, includeAudit, includeHistory: true, includeLinkedRecords: true })}
        className="mt-4 rounded-lg bg-[var(--psm-accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Creating...' : 'Create Export'}
      </button>
    </section>
  );
}
