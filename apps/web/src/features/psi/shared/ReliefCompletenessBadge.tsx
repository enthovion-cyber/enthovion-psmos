export function ReliefCompletenessBadge({ value, score }: { value?: string | null | undefined; score?: number | null | undefined }) {
  const text = `${value || 'Not Reviewed'}${score === null || score === undefined ? '' : ` (${score}%)`}`;
  const tone = /critical|incomplete|overdue/i.test(value || '') ? 'text-danger bg-danger/10 border-danger/30' : /mostly|warning/i.test(value || '') ? 'text-warning bg-warning/10 border-warning/30' : /complete/i.test(value || '') ? 'text-success bg-success/10 border-success/30' : 'text-[var(--psm-muted)] bg-[var(--psm-surface-2)] border-[var(--psm-line)]';
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
