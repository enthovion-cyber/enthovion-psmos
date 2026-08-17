export function DocumentTypeBadge({ type }: { type?: string | null }) {
  return <span className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold">{type || 'Document'}</span>;
}
