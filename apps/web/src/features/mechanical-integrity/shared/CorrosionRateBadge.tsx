export function CorrosionRateBadge({ value }: { value?: string | number | null | undefined }) {
  const number = Number(value ?? 0);
  const tone = number > 0.5 ? 'bg-danger/10 text-danger' : number > 0.1 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{value ?? 'Not calculated'}</span>;
}
