export function ChemistryTypeBadge({ value }: { value?: string | null | undefined }) {
  return <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{value ?? 'Not set'}</span>;
}
