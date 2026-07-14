import { ContactSalesForm } from './ContactSalesForm';

export function ContactSalesPage({ plan = 'enterprise' }: { plan?: string | undefined }) {
  return (
    <main className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Contact Sales</p>
          <h1 className="mt-3 text-5xl font-black tracking-normal">Plan an enterprise PSM OS rollout.</h1>
          <p className="mt-5 text-base leading-7 text-[var(--psm-muted)]">Use this form for Enterprise plans, multi-site onboarding, SSO readiness, advanced audit, custom implementation, or priority support discussions.</p>
        </div>
        <ContactSalesForm plan={plan} />
      </div>
    </main>
  );
}
