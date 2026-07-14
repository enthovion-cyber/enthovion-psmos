export function HazopHistoryEventTypeBadge({ value }: { value?: string }) {
  const label = value ?? 'EVENT';
  return <span className="inline-flex rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-200">{label.replace(/_/g, ' ')}</span>;
}
