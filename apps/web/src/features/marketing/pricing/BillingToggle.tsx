'use client';

export function BillingToggle() {
  return (
    <div className="inline-flex rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1">
      <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white">Monthly</span>
      <span className="px-3 py-1.5 text-xs font-black text-[var(--psm-muted)]">Annual soon</span>
    </div>
  );
}
