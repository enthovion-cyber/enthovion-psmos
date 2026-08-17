export function RemainingLifeBadge({ value }: { value?: string | number | null | undefined }) {
  const number = Number(value ?? 999);
  const tone = number <= 0 ? 'bg-danger/10 text-danger' : number <= 2 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{value ?? 'Not calculated'}</span>;
}
