export function ContextSwitchLoadingOverlay({ label = 'Switching workspace context...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/25 backdrop-blur-sm">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-5 py-4 text-sm shadow-xl">
        <div className="h-5 w-44 animate-pulse rounded bg-[var(--psm-line)]" />
        <div className="mt-3 text-[var(--psm-muted)]">{label}</div>
      </div>
    </div>
  );
}
