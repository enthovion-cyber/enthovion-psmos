export function PermissionDeniedState({ reason = 'You do not have permission to manage this workspace area.' }: { reason?: string }) {
  return <div className="psm-card p-8 text-center"><h2 className="text-lg font-semibold">Permission denied</h2><p className="mt-2 text-sm text-[var(--psm-muted)]">{reason}</p></div>;
}
