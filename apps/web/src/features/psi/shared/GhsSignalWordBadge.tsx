export function GhsSignalWordBadge({ value }: { value?: string | null | undefined }) {
  const word = value ?? 'Missing';
  const cls = word === 'Danger' ? 'bg-danger/10 text-danger border-danger/30' : word === 'Warning' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{word}</span>;
}
