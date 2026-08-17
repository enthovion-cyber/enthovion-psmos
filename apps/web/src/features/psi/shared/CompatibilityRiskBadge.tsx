export function CompatibilityRiskBadge({ risk }: { risk?: string | null | undefined }) {
  const value = risk ?? 'Not Reviewed';
  const cls = value === 'Critical' ? 'border-danger/40 bg-danger/10 text-danger' : value === 'High' ? 'border-warning/40 bg-warning/10 text-warning' : value === 'Low' ? 'border-success/30 bg-success/10 text-success' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{value}</span>;
}
