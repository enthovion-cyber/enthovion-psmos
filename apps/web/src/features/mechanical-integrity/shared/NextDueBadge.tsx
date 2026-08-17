export function NextDueBadge({ value }: { value?: string | null | undefined }) {
  const overdue = !!value && new Date(value).getTime() < Date.now();
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${overdue ? 'bg-danger/10 text-danger' : value ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{value ?? 'Not scheduled'}</span>;
}
