export function DocumentStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Missing';
  const tone = /missing|expired|rejected|superseded/i.test(value) ? 'border-danger/30 bg-danger/10 text-danger' : /pending|draft|required/i.test(value) ? 'border-warning/30 bg-warning/10 text-warning' : 'border-success/30 bg-success/10 text-success';
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
