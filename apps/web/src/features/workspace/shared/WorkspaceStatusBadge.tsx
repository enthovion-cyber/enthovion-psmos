export function WorkspaceStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'ACTIVE';
  const className = value === 'ACTIVE' || value === 'COMPLETED'
    ? 'border-success/30 bg-success/10 text-success'
    : value === 'ARCHIVED'
      ? 'border-danger/30 bg-danger/10 text-danger'
      : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}
