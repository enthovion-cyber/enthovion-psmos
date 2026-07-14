'use client';

export function UserAssignedRecordsPanel() {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Assigned Records</h2>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Active responsibility checks are resolved by the backend removal-impact API before deactivation, archive, or delete actions.</p>
    </section>
  );
}
