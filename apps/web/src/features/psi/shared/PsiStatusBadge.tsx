export function PsiStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Set';
  const tone = value === 'Approved' || value === 'Active' ? 'bg-success/10 text-success border-success/30' : value === 'Archived' || value === 'Rejected' ? 'bg-danger/10 text-danger border-danger/30' : value === 'Submitted' || value === 'Under Review' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
