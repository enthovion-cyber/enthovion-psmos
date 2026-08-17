export function ReportStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Determined';
  const tone = value.includes('Failed') ? 'border-danger/40 bg-danger/10 text-danger' : value.includes('Warning') || value.includes('Regeneration') ? 'border-warning/40 bg-warning/10 text-warning' : value.includes('Generated') ? 'border-success/40 bg-success/10 text-success' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
