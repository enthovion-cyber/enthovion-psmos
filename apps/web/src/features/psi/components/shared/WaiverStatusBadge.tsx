export function WaiverStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Requested';
  const tone = value === 'Approved' ? 'border-success/30 bg-success/10 text-success' : value === 'Rejected' || value === 'Revoked' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
