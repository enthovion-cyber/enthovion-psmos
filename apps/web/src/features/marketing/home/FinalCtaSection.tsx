import { StartTrialButton } from '../cta/StartTrialButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';

export function FinalCtaSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-blue-400/20 bg-[linear-gradient(135deg,rgba(37,99,235,.18),rgba(20,184,166,.10)),var(--psm-surface)] p-6 shadow-[var(--psm-shadow)] sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Ready for safety-critical operations</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal">Start your 14-day trial without a credit card.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--psm-muted)]">Create the workspace, add your sites, invite your team, and explore the core PSM workflows before choosing a paid plan.</p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <StartTrialButton />
          <ContactSalesButton />
        </div>
      </div>
    </section>
  );
}
