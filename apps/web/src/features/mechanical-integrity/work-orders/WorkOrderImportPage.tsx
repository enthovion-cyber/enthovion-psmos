'use client';

import { useState } from 'react';
import { useWorkOrderMutations } from '../hooks/useWorkOrders';
import { ActionButton, PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';

export function WorkOrderImportPage() {
  const mutations = useWorkOrderMutations();
  const [rowsJson, setRowsJson] = useState('[]');
  const [fileName, setFileName] = useState('mi-work-orders-import.csv');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMessage(null);
    let rows: unknown;
    try {
      rows = JSON.parse(rowsJson);
    } catch {
      setError('Rows must be valid JSON. Use an array of work-order rows from the CSV parser/import worker.');
      return;
    }
    if (!Array.isArray(rows)) {
      setError('Rows must be a JSON array.');
      return;
    }
    const result = await mutations.importRows.mutateAsync({ fileName, rows });
    setMessage(String(result.message ?? 'Import job created.'));
  };

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
        <h1 className="mt-1 text-2xl font-bold">Import Work Orders</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Create a protected import job for MI work orders. Storage upload parsing can feed this endpoint without changing the API contract.</p>
      </header>
      <SectionCard title="Import Job" description="Paste parsed rows or submit an empty job after uploading a file through the platform import worker.">
        <div className="space-y-4">
          {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {message ? <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div> : null}
          <label className="block text-sm font-semibold">File name
            <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={fileName} onChange={(event) => setFileName(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Parsed rows JSON
            <textarea rows={10} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 font-mono text-xs" value={rowsJson} onChange={(event) => setRowsJson(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={() => void submit()} disabled={mutations.importRows.isPending}>{mutations.importRows.isPending ? 'Creating...' : 'Create Import Job'}</PrimaryButton>
            <a href="/api/v1/mechanical-integrity/work-orders/import-template"><ActionButton>Download Template</ActionButton></a>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
