export function DocumentExcludedBadge({ reason = 'Metadata only' }: { reason?: string }) {
  return <span className="inline-flex rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-muted)]">{reason}</span>;
}
