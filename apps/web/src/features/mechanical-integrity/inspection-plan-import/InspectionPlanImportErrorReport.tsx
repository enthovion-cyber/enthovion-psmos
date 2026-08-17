export function InspectionPlanImportErrorReport({ job }: { job?: Record<string, unknown> | null }) {
  const rows = (job?.rows as Array<Record<string, unknown>> | undefined) ?? [];
  const invalid = rows.filter((row) => row.validation_status === 'Invalid');
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Error Report</h2>{invalid.length ? invalid.map((row) => <div key={String(row.id)} className="mt-2 rounded bg-danger/10 p-2 text-sm text-danger">Row {String(row.row_number)}: {JSON.stringify(row.validation_errors_json)}</div>) : <p className="mt-2 text-sm text-[var(--psm-muted)]">No row errors.</p>}</div>;
}
