export function InitialsPreviewCard({ initials }: { initials: string }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-center">
      <div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">Initials</div>
      <div className="mt-3 text-5xl font-black tracking-widest text-info">{initials || '--'}</div>
    </div>
  );
}
