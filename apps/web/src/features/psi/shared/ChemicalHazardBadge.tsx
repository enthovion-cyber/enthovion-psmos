export function ChemicalHazardBadge({ label }: { label?: string | null }) {
  return <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{label || 'Hazard data missing'}</span>;
}
