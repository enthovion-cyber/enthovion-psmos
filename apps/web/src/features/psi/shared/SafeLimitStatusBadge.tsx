const tones: Record<string, string> = {
  Draft: 'border-warning/30 bg-warning/10 text-warning',
  Active: 'border-success/30 bg-success/10 text-success',
  'Under Review': 'border-info/30 bg-info/10 text-info',
  Approved: 'border-success/30 bg-success/10 text-success',
  Archived: 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
};

export function SafeLimitStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not set';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[value] ?? 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)]'}`}>{value}</span>;
}
