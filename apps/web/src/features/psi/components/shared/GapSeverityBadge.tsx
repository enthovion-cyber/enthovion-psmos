export function GapSeverityBadge({ severity }: { severity?: string | null | undefined }) {
  const value = severity ?? 'Unknown';
  const tone = value === 'Startup Blocker' || value === 'Critical' ? 'border-danger/30 bg-danger/10 text-danger' : value === 'High' ? 'border-warning/30 bg-warning/10 text-warning' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
