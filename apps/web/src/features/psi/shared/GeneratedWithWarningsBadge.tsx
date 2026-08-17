export function GeneratedWithWarningsBadge({ warnings }: { warnings?: boolean | number | null | undefined }) {
  const count = typeof warnings === 'number' ? warnings : warnings ? 1 : 0;
  if (!count) return <span className="inline-flex rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Clean</span>;
  return <span className="inline-flex rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">{count} warning{count === 1 ? '' : 's'}</span>;
}
