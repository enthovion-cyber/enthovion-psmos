'use client';

import { workflowSteps } from './marketing-content';
import { ArrowRight, CheckCircle2, Workflow, ShieldCheck, GitBranch, Cpu, Lock } from 'lucide-react';

export function WorkflowSection() {
  const pipeline = [
    {
      num: '01',
      title: 'Company & Multi-Site Scope',
      stage: 'ORGANIZATIONAL SETUP',
      desc: 'Define corporate workspace, operating plants, processing units, and equipment tag registries with strict tenant isolation.'
    },
    {
      num: '02',
      title: 'Granular Role Assignment',
      stage: 'RBAC PERMISSIONS',
      desc: 'Configure permission profiles for Operations, Safety Engineers, Maintenance, Auditors, and Contractor personnel.'
    },
    {
      num: '03',
      title: 'Hazard & Deviation Screening',
      stage: 'PHA / LOPA GOVERNANCE',
      desc: 'Conduct HAZOP node deviations, calculate risk ranking, and validate required Independent Protection Layers (IPLs).'
    },
    {
      num: '04',
      title: 'MOC Change Control Gate',
      stage: 'CHANGE MANAGEMENT',
      desc: 'Manage technical, operational, and organizational changes through multi-discipline review and PSSR checklist triggers.'
    },
    {
      num: '05',
      title: 'Control of Work & Field PTW',
      stage: 'LIVE FIELD PERMITTING',
      desc: 'Issue digital hot work, cold work, and confined space permits with live gas telemetry, LOTO locks, and SIMOPS conflict checks.'
    },
    {
      num: '06',
      title: 'PSSR Pre-Startup Authorization',
      stage: 'STARTUP READINESS',
      desc: 'Enforce physical walk-down verification and multidisciplinary sign-off before introducing hazardous hydrocarbons or energy.'
    },
    {
      num: '07',
      title: 'Immutable Compliance Archive',
      stage: 'AUDIT GOVERNANCE',
      desc: 'Every change, action, test, and electronic signature is cryptographically logged for instantaneous OSHA & ISO audit defense.'
    }
  ];

  return (
    <section id="workflow" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[var(--psm-bg)] transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-500">
            <Workflow size={13} />
            <span>Industrial Safety Governance Pipeline</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
            From Hazard Identification to Signed,{' '}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Audit-Proof Evidence.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] font-normal">
            How Enthovion PSM OS guarantees continuous compliance and eliminates safety barrier degradation across operating industrial facilities.
          </p>
        </div>

        {/* 7-Step Pipeline Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pipeline.slice(0, 4).map((item) => (
            <div
              key={item.num}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] p-6 shadow-xs transition-all duration-200 hover:border-[var(--psm-primary)]/50 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <span className="font-mono text-xs font-black text-[var(--psm-primary)]">
                    PHASE {item.num}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                    {item.stage}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-[var(--psm-text)] leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                <span className="text-[11px]">Enforced Validation Gate</span>
              </div>
            </div>
          ))}
        </div>

        {/* Second Row (Steps 5 - 7) */}
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {pipeline.slice(4).map((item) => (
            <div
              key={item.num}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] p-6 shadow-xs transition-all duration-200 hover:border-[var(--psm-primary)]/50 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <span className="font-mono text-xs font-black text-[var(--psm-primary)]">
                    PHASE {item.num}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                    {item.stage}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-[var(--psm-text)] leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                <span className="text-[11px]">Enforced Validation Gate</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
