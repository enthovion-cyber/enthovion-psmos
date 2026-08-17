const tones: Record<string, string> = {
  'No Conflict': 'border-success/30 bg-success/10 text-success',
  Warning: 'border-warning/30 bg-warning/10 text-warning',
  'Major Conflict': 'border-danger/30 bg-danger/10 text-danger',
  'Critical Conflict': 'border-danger/40 bg-danger/15 text-danger',
  'Override Approved': 'border-info/30 bg-info/10 text-info',
  'Not Reviewed': 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
};

export function LimitConflictBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Reviewed';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[value] ?? tones['Not Reviewed']}`}>{value}</span>;
}
