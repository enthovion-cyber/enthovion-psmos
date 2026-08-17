export function ZoneClassDivisionBadge({ zone, division }: { zone?: string | null | undefined; division?: string | null | undefined }) {
  const text = zone || division || 'Unclassified';
  return <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{text}</span>;
}
