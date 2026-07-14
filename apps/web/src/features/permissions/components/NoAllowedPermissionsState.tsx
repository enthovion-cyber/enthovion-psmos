export function NoAllowedPermissionsState({ message = 'No allowed permissions are available for the active company or site.' }: { message?: string }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">
      {message}
    </div>
  );
}

