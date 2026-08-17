export function PsiCriticalGapBadge({ count, blocker }: { count?: number | null; blocker?: boolean }) {
  const value = Number(count ?? 0);
  const tone = value > 0 || blocker ? 'bg-danger/10 text-danger border-danger/30' : 'bg-success/10 text-success border-success/30';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value ? `${value} critical gaps` : 'No critical gaps'}</span>;
}
