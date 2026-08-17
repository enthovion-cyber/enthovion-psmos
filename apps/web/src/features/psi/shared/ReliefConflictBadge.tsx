export function ReliefConflictBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not Reviewed';
  const tone = /critical|major/i.test(text) ? 'text-danger bg-danger/10 border-danger/30' : /warning/i.test(text) ? 'text-warning bg-warning/10 border-warning/30' : /no conflict|override approved/i.test(text) ? 'text-success bg-success/10 border-success/30' : 'text-[var(--psm-muted)] bg-[var(--psm-surface-2)] border-[var(--psm-line)]';
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
