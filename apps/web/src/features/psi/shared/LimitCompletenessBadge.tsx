const tones: Record<string, string> = {
  Complete: 'border-success/30 bg-success/10 text-success',
  'Mostly Complete': 'border-info/30 bg-info/10 text-info',
  Incomplete: 'border-warning/30 bg-warning/10 text-warning',
  'Critical Gaps': 'border-danger/30 bg-danger/10 text-danger',
  'Not Reviewed': 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]',
  'Review Overdue': 'border-danger/30 bg-danger/10 text-danger'
};

export function LimitCompletenessBadge({ status, score }: { status?: string | null | undefined; score?: number | null | undefined }) {
  const value = status ?? 'Not Reviewed';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[value] ?? tones['Not Reviewed']}`}>{value}{score !== null && score !== undefined ? ` (${score}%)` : ''}</span>;
}
