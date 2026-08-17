export function GapStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Open';
  const tone = ['Closed', 'Verified', 'Waived'].includes(value) ? 'border-success/30 bg-success/10 text-success' : ['Open', 'Reopened', 'Assigned'].includes(value) ? 'border-warning/30 bg-warning/10 text-warning' : 'border-primary/30 bg-primary/10 text-primary';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
