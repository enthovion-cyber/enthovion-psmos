const tone = (value?: string | null | undefined) => value === 'Critical' ? 'border-danger/40 bg-danger/10 text-danger' : value === 'High' ? 'border-warning/50 bg-warning/10 text-warning' : value === 'Medium' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';

export function ReactionHazardBadge({ value }: { value?: string | null | undefined }) {
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone(value)}`}>{value ?? 'Unknown / Needs Study'}</span>;
}
