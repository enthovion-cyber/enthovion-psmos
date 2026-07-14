export function ReadOnlyBanner({ reason }: { reason: string }) {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
      <strong>Read-only:</strong> {reason}
    </div>
  );
}
