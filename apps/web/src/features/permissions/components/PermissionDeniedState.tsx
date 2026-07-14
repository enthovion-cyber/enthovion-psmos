export function PermissionDeniedState({ reason = 'You do not have permission to view these permissions.' }: { reason?: string }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
      {reason}
    </div>
  );
}

