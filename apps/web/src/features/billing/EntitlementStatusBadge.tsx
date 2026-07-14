export function EntitlementStatusBadge({ enabled }: { enabled: boolean }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${enabled ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{enabled ? 'Enabled' : 'Upgrade required'}</span>;
}
