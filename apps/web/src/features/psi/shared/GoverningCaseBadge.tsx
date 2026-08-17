export function GoverningCaseBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${value ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>{value ? 'Governing case' : 'Not governing'}</span>;
}
