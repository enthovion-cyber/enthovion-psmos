export function ChemistryCompletenessBadge({ status, score }: { status?: string | null | undefined; score?: number | null | undefined }) {
  const danger = status === 'Critical Gaps' || status === 'Incomplete';
  const good = status === 'Complete';
  const color = danger ? 'border-danger/40 bg-danger/10 text-danger' : good ? 'border-success/40 bg-success/10 text-success' : 'border-warning/40 bg-warning/10 text-warning';
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${color}`}>{status ?? 'Not Reviewed'}{score !== undefined && score !== null ? ` - ${score}%` : ''}</span>;
}
