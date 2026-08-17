export function PsiCompletenessBadge({ status, score }: { status?: string | null | undefined; score?: number | null | undefined }) {
  const value = status ?? 'Not Reviewed';
  const tone = value === 'Complete' ? 'bg-success/10 text-success border-success/30' : value === 'Critical Gaps' ? 'bg-danger/10 text-danger border-danger/30' : value === 'Mostly Complete' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-warning/10 text-warning border-warning/30';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}{typeof score === 'number' ? ` - ${Math.round(score)}%` : ''}</span>;
}
