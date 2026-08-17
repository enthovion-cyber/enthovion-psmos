export function ImpairmentStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Unknown';
  const tone = /expired|rejected|cancelled/i.test(value) ? 'border-danger/30 bg-danger/10 text-danger' : /active|extension/i.test(value) ? 'border-warning/30 bg-warning/10 text-warning' : /approved|restored|closed|verified/i.test(value) ? 'border-success/30 bg-success/10 text-success' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
