'use client';

export function UserSecurityPanel() {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Security Actions</h2>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Reset password, resend invitation, force logout, and MFA flags are handled through admin endpoints with audit and session refresh.</p>
    </section>
  );
}
