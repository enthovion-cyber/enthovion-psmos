'use client';

export function CmlImportCommitPanel({ job, onValidate, onCommit, validating, committing }: { job?: Record<string, any> | null; onValidate: () => void; onCommit: () => void; validating?: boolean; committing?: boolean }) {
  if (!job) return null;
  const rows = Array.isArray(job.rows) ? job.rows : [];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-[var(--psm-text)]">Import Validation / Commit</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        {['status', 'total_rows', 'valid_rows', 'error_rows'].map((key) => <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</p><p className="font-bold text-[var(--psm-text)]">{String(job[key] ?? '-')}</p></div>)}
      </div>
      {rows.some((row: any) => row.validation_errors?.length) ? <div className="mt-4 space-y-2">{rows.filter((row: any) => row.validation_errors?.length).map((row: any) => <div key={row.id ?? row.row_number} className="rounded-lg bg-danger/10 p-3 text-sm text-danger">Row {row.row_number}: {(row.validation_errors ?? []).join(', ')}</div>)}</div> : null}
      <div className="mt-4 flex gap-2">
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onValidate} disabled={validating}>{validating ? 'Validating...' : 'Validate Rows'}</button>
        <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={onCommit} disabled={committing || Number(job.error_rows ?? 0) > 0}>{committing ? 'Committing...' : 'Commit Import'}</button>
      </div>
    </section>
  );
}
