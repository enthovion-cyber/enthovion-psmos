'use client';

import { Building2, Factory, Flame, Zap, Shield, Atom, Users, Wrench } from 'lucide-react';

const solutions = [
  { id: 'chemical', title: 'Chemical Manufacturing', icon: Factory, text: 'Manage process safety records, actions, permits, MOC, studies, and compliance evidence across chemical production units.' },
  { id: 'oil-gas', title: 'Oil & Gas (Upstream & Midstream)', icon: Flame, text: 'Support high-hazard operations with multi-site workflows, multi-stage approvals, secure evidence, and contractor access control.' },
  { id: 'fertilizer', title: 'Fertilizer & Ammonia Plants', icon: Atom, text: 'Connect PSM workflows across reaction units, maintenance schedules, operations, engineering, and HSE leadership.' },
  { id: 'utilities', title: 'Power & Critical Utilities', icon: Zap, text: 'Control work, mechanical changes, incidents, documents, and audit trails for mission-critical infrastructure.' },
  { id: 'ehs', title: 'EHS & Regulatory Leadership', icon: Shield, text: 'Coordinate PHA recommendations, root-cause investigations, compliance reviews, and executive reporting.' },
  { id: 'engineers', title: 'Process Safety Engineers', icon: Wrench, text: 'Conduct HAZOP nodes, LOPA SIL determinations, MOC evaluations, and PSSR walk-down checklists with zero data loss.' },
  { id: 'operations', title: 'Plant Operations & Shift Supervisors', icon: Users, text: 'Monitor active permits, startup blockers, overdue actions, barrier health indices, and required approval sign-offs.' }
];

export function SolutionsPage() {
  return (
    <main className="px-4 py-16 sm:px-6 lg:px-8 bg-[var(--psm-bg)] transition-colors">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-primary)]/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[var(--psm-primary)]">
            <Building2 size={13} />
            <span>Industrial Sector Solutions</span>
          </div>
          <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--psm-text)] leading-tight">
            Built for Industrial Teams That Own Safety-Critical Operations.
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--psm-muted)]">
            Tailored process safety workflows and multi-discipline collaboration tools designed for facilities with high hazard inventories.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((item) => (
            <section
              id={item.id}
              key={item.id}
              className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm transition hover:border-[var(--psm-primary)] hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-primary)]">
                <item.icon size={22} />
              </div>
              <h2 className="mt-4 text-lg font-black text-[var(--psm-text)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--psm-muted)]">{item.text}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
