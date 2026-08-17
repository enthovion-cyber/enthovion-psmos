export function BypassTypeBadge({ type }: { type?: string | null | undefined }) {
  return <span className="inline-flex rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold">{type || 'Bypass / impairment'}</span>;
}
