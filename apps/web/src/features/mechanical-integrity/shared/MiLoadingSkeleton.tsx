export function MiLoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]" />
      ))}
    </div>
  );
}
