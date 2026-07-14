import Link from 'next/link';

const tabs: Array<[string, string]> = [
  ['Overview', '/settings/billing'],
  ['Plan', '/settings/billing/plan'],
  ['Usage', '/settings/billing/usage'],
  ['Payment Method', '/settings/billing/payment-method'],
  ['Invoices', '/settings/billing/invoices']
];

export function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-5 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Company billing</p>
        <h1 className="text-2xl font-semibold">Billing and subscription</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">Manage company plan, entitlements, usage limits, invoices, and provider-safe payment flows.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map(([label, href]) => <Link key={href} href={href} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm hover:border-info">{label}</Link>)}
      </nav>
      {children}
    </section>
  );
}
