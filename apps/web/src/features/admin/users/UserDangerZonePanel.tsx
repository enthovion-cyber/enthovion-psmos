'use client';

export function UserDangerZonePanel() {
  return (
    <section className="psm-card border-danger/30 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">Danger Zone</h2>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Protected user, last-admin, active responsibility, and self-deactivation safeguards are enforced by the backend.</p>
    </section>
  );
}
