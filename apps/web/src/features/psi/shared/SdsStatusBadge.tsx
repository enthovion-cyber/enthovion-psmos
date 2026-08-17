export function SdsStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Missing';
  const cls = value === 'Current' ? 'border-success/30 bg-success/10 text-success' : ['Missing', 'Expired', 'Rejected'].includes(value) ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{value}</span>;
}
