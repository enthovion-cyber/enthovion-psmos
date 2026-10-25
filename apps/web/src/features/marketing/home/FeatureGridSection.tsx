'use client';

import { featureCards, teamRoles } from './marketing-content';
import { ShieldCheck, Network, Layers, Lock, Cpu, Building2, Map, ArrowUpRight } from 'lucide-react';

export function FeatureGridSection() {
  const cards = [
    {
      title: 'Unified Multi-Site Hierarchy',
      tag: 'ENTERPRISE DOMAIN',
      desc: 'Model complex industrial organizations seamlessly: Company Workspace ➔ Operating Sites ➔ Process Units ➔ Areas ➔ Equipment Tag Registries.',
      icon: Building2,
      metric: 'Multi-Tenant Isolation'
    },
    {
      title: 'Fine-Grained RBAC Governance',
      tag: 'ACCESS CONTROL',
      desc: 'Guarded permissions for Operations, Safety Engineers, Maintenance Managers, Plant Leaders, Contractors, and Third-Party Regulatory Auditors.',
      icon: Lock,
      metric: '45+ Granular Permissions'
    },
    {
      title: 'Real-Time Barrier & Risk Engine',
      tag: 'ACTIVE INTEGRITY',
      desc: 'Track physical and instrumented Independent Protection Layers (IPLs) continuously. Detect barrier degradation before catastrophic events unfold.',
      icon: ShieldCheck,
      metric: 'Continuous Health Index'
    },
    {
      title: 'Central Command & Event Bus',
      tag: 'OPERATIONAL COMMAND',
      desc: 'Real-time visibility across open MOCs, PSSR readiness gates, hot work field permits, gas detection telemetry, and overdue CAPA items.',
      icon: Layers,
      metric: 'Live Event Stream'
    }
  ];

  return (
    <section id="features" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[var(--psm-bg)] transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-primary)]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)] shadow-xs">
            <Layers size={13} />
            <span>Industrial Operating Architecture</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
            A Serious Operating System for{' '}
            <span className="bg-gradient-to-r from-[var(--psm-primary)] to-amber-500 bg-clip-text text-transparent">
              Process Safety Records
            </span>
            , Teams, and Decisions.
          </h2>

          <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] font-normal">
            Replace fragmented spreadsheets, paper binder checklists, and disconnected point solutions with a single, synchronized platform built to eliminate catastrophic operational failure.
          </p>
        </div>

        {/* 4 Architecture Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--psm-primary)]/50 hover:shadow-xl"
            >
              {/* Subtle top glow line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--psm-primary)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface-2)] text-[var(--psm-primary)] shadow-2xs transition-transform group-hover:scale-110">
                    <card.icon size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--psm-muted)] group-hover:text-[var(--psm-primary)] transition">
                    {card.tag}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[var(--psm-text)] leading-snug">
                  {card.title}
                </h3>

                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs font-semibold text-[var(--psm-primary)]">
                <span>{card.metric}</span>
                <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Multi-Discipline Stakeholder Ribbon */}
        <div className="mt-10 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)]/80 backdrop-blur-sm p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--psm-text)]">
                Unified Governance Across All Plant Stakeholders
              </p>
              <p className="text-xs text-[var(--psm-muted)] mt-0.5">
                Every stakeholder accesses the exact scope, data views, and approval authority designated for their role.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {teamRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-text)] transition hover:border-[var(--psm-primary)]/40 hover:text-[var(--psm-primary)]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
