export function GasDustGroupBadge({ gasGroup, dustGroup }: { gasGroup?: string | null | undefined; dustGroup?: string | null | undefined }) {
  const text = [gasGroup, dustGroup].filter(Boolean).join(' / ') || 'Group Missing';
  return <span className="inline-flex rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold">{text}</span>;
}
