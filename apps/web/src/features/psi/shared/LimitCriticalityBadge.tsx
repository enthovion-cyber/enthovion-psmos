const tones: Record<string, string> = {
  Low: 'border-success/30 bg-success/10 text-success',
  Medium: 'border-info/30 bg-info/10 text-info',
  High: 'border-warning/30 bg-warning/10 text-warning',
  Critical: 'border-danger/30 bg-danger/10 text-danger'
};

export function LimitCriticalityBadge({ value }: { value?: string | null }) {
  const label = value ?? 'Not set';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[label] ?? 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)]'}`}>{label}</span>;
}
