export function SettingsPermissionDeniedState() {
  return (
    <div className="psm-card border-warning/40 bg-warning/10 p-5 text-sm text-warning">
      You do not have access to workspace/admin settings. Profile and help options remain available from the sidebar user menu.
    </div>
  );
}
