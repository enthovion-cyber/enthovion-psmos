const solutions = [
  ['chemical', 'Chemical Manufacturing', 'Manage process safety records, actions, permits, MOC, studies, and compliance evidence across chemical production teams.'],
  ['oil-gas', 'Oil & Gas', 'Support high-hazard operations with multi-site workflows, approvals, secure evidence, and contractor access.'],
  ['fertilizer', 'Fertilizer', 'Connect PSM workflows across units, maintenance, operations, engineering, and HSE teams.'],
  ['utilities', 'Utilities', 'Control work, changes, incidents, documents, and audit trails for critical infrastructure operations.'],
  ['ehs', 'EHS Teams', 'Coordinate recommendations, investigations, compliance reviews, reporting, and verified closure.'],
  ['engineers', 'Process Safety Engineers', 'Build HAZOP, LOPA/SIL, MOC, PSSR, and action workflows with consistent governance.'],
  ['operations', 'Plant Operations', 'See active work, blocked startup, open actions, readiness, incidents, and required approvals.']
];

export function SolutionsPage() {
  return (
    <main className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Solutions</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-normal">Built for industrial teams that own safety-critical work.</h1>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map(([id, title, text]) => (
            <section id={id} key={id} className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-[var(--psm-shadow-soft)]">
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--psm-muted)]">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
