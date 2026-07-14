import { featureCards, teamRoles } from './marketing-content';

export function FeatureGridSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Unified PSM Workspace</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal">A serious workspace for process safety records, teams, and decisions.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--psm-muted)]">Designed for HSE managers, process safety engineers, operations managers, maintenance managers, plant leaders, contractors, and auditors.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-[var(--psm-shadow-soft)]">
              <card.icon className="text-blue-500" size={24} />
              <h3 className="mt-5 text-lg font-black">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--psm-muted)]">{card.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {teamRoles.map((role) => <span key={role} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--psm-muted)]">{role}</span>)}
        </div>
      </div>
    </section>
  );
}
