export function ExProtectionBadge({ value }: { value?: string | null | undefined }) {
  return <span className="inline-flex rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-xs font-semibold text-info">{value || 'Protection TBD'}</span>;
}
