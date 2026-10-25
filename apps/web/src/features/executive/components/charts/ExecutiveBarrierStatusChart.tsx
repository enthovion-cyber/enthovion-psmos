'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity, CheckCircle, Wrench } from 'lucide-react';
import type { ExecutiveRiskCase } from '../../types/executive-critical-risk.types';

interface Props {
  cases: ExecutiveRiskCase[];
}

export function ExecutiveBarrierStatusChart({ cases }: Props) {
  // Find cases relating to barriers or mechanical integrity
  const barrierCases = cases.filter(
    (c) =>
      c.barrier_impaired ||
      /barrier/i.test(String(c.case_type ?? '')) ||
      c.source_module === 'mechanical-integrity'
  );

  const impairedCount = barrierCases.filter((c) => c.barrier_impaired || /impaired/i.test(String(c.source_status ?? ''))).length;
  const overdueTestCount = barrierCases.filter((c) => /overdue|test/i.test(String(c.source_status ?? ''))).length;
  const inServiceCount = Math.max(0, barrierCases.length - impairedCount - overdueTestCount);

  // Common process safety barrier categories
  const categories = [
    {
      name: 'Safety Instrumented Systems (SIS / SIF)',
      code: 'SIS',
      impaired: cases.filter((c) => /sis|sif|interlock/i.test(c.risk_title || c.case_title || '')).length,
      description: 'Automated trip functions, safety instrumented loops',
    },
    {
      name: 'Pressure Relief & Flare Systems (PSV)',
      code: 'PSV',
      impaired: cases.filter((c) => /psv|relief|flare|rupture/i.test(c.risk_title || c.case_title || '')).length,
      description: 'Overpressure protection, pressure safety valves',
    },
    {
      name: 'Emergency Isolation & Depressuring (EDP / ESD)',
      code: 'ESD',
      impaired: cases.filter((c) => /esd|isolation|depressuring|blowdown/i.test(c.risk_title || c.case_title || '')).length,
      description: 'Emergency shutdown, remote actuated block valves',
    },
    {
      name: 'Fire & Gas Detection Systems (F&G)',
      code: 'F&G',
      impaired: cases.filter((c) => /fire|gas|flame|combustible|toxic/i.test(c.risk_title || c.case_title || '')).length,
      description: 'Optical flame, toxic, and flammable gas detectors',
    },
    {
      name: 'Passive Fireproofing & Containment',
      code: 'PFP',
      impaired: cases.filter((c) => /bund|containment|fireproofing|dike/i.test(c.risk_title || c.case_title || '')).length,
      description: 'Blast walls, fire barriers, tertiary containment',
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={20} />
            <h3 className="font-semibold text-[var(--psm-text)]">Process Safety Barrier Impairment Cockpit</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Active status of safety-critical elements (SCEs) and independent protection layers (IPLs).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            {impairedCount} Impaired
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {overdueTestCount} Test Overdue
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {inServiceCount} Nominal
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((cat) => {
          const isCritical = cat.impaired > 0;
          return (
            <div
              key={cat.code}
              className={`rounded-lg border p-3 transition ${
                isCritical
                  ? 'border-rose-500/30 bg-rose-500/5 shadow-xs'
                  : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-[var(--psm-surface-2)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)]">
                  {cat.code}
                </span>
                {isCritical ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    <ShieldAlert size={13} />
                    {cat.impaired} Impaired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={13} />
                    Healthy
                  </span>
                )}
              </div>
              <h4 className="mt-2 text-xs font-semibold text-[var(--psm-text)] line-clamp-1" title={cat.name}>
                {cat.name}
              </h4>
              <p className="mt-1 text-[11px] text-[var(--psm-muted)] line-clamp-2">{cat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
