export function PsiReviewStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Reviewed';
  const tone = value === 'Approved' ? 'bg-success/10 text-success border-success/30' : value === 'Rejected' || value === 'Returned' ? 'bg-danger/10 text-danger border-danger/30' : value === 'Submitted' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
