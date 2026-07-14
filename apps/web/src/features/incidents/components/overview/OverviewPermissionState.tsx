export function OverviewPermissionState({ message = 'You do not have permission to view this incident overview.' }: { message?: string }) {
  return <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-6 text-sm text-amber-700 dark:text-amber-200"><b>Permission denied</b><div className="mt-1">{message}</div></div>;
}
