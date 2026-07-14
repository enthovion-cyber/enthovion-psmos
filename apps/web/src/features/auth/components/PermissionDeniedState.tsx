export function PermissionDeniedState({ message = 'You do not have permission to access this workspace area.' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-danger/25 bg-danger/10 p-4 text-sm text-danger">
      <div className="font-semibold">Permission denied</div>
      <p className="mt-1 text-danger/80">{message}</p>
    </div>
  );
}
