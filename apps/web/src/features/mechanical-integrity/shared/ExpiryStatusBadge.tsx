export function ExpiryStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Unknown';
  const tone = /expired|overdue/i.test(value) ? 'border-danger/40 bg-danger/10 text-danger' : /soon/i.test(value) ? 'border-warning/40 bg-warning/10 text-warning' : 'border-success/30 bg-success/10 text-success';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
