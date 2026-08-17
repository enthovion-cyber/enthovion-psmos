export function HighHazardBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${value ? 'border-danger/30 bg-danger/10 text-danger' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{value ? 'High Hazard' : 'Not High Hazard'}</span>;
}
