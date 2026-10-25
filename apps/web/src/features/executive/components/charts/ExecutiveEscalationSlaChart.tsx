'use client';

import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { ExecutiveEscalation } from '../../types/executive-critical-risk.types';

interface Props {
  escalations: ExecutiveEscalation[];
}

export function ExecutiveEscalationSlaChart({ escalations }: Props) {
  const activeEscalations = escalations.filter((e) => !['Closed', 'Cancelled', 'Superseded'].includes(e.escalation_status));
  const total = activeEscalations.length;

  const breached = activeEscalations.filter((e) => {
    if (!e.response_due_at && !e.due_at) return false;
    const due = new Date(e.response_due_at || e.due_at || '').getTime();
    return due < Date.now();
  }).length;

  const dueSoon = activeEscalations.filter((e) => {
    if (!e.response_due_at && !e.due_at) return false;
    const due = new Date(e.response_due_at || e.due_at || '').getTime();
    const diffHours = (due - Date.now()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  }).length;

  const withinSla = Math.max(0, total - breached - dueSoon);

  const levels = [
    { level: 0, label: 'L0: Owner Follow-Up', count: activeEscalations.filter((e) => Number(e.escalation_level) === 0).length, color: 'bg-slate-500' },
    { level: 1, label: 'L1: Dept Manager', count: activeEscalations.filter((e) => Number(e.escalation_level) === 1).length, color: 'bg-blue-500' },
    { level: 2, label: 'L2: Site PSM / HSE', count: activeEscalations.filter((e) => Number(e.escalation_level) === 2).length, color: 'bg-amber-500' },
    { level: 3, label: 'L3: Plant / Site Mgr', count: activeEscalations.filter((e) => Number(e.escalation_level) === 3).length, color: 'bg-orange-500' },
    { level: 4, label: 'L4: Corporate PSM', count: activeEscalations.filter((e) => Number(e.escalation_level) === 4).length, color: 'bg-rose-500' },
    { level: 5, label: 'L5: Executive Leadership', count: activeEscalations.filter((e) => Number(e.escalation_level) >= 5).length, color: 'bg-purple-600' },
  ];

  const maxLevelCount = Math.max(...levels.map((l) => l.count), 1);

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <h3 className="font-semibold text-[var(--psm-text)]">Escalation Velocity &amp; SLA Adherence</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Active multi-tier leadership escalations with strict SLA countdowns.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            {breached} SLA Breached
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {dueSoon} Due Soon (&lt; 24h)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {withinSla} Within SLA
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 size={36} className="text-emerald-500" />
          <p className="mt-2 text-sm font-medium text-[var(--psm-text)]">No Active Escalations</p>
          <p className="text-xs text-[var(--psm-muted)]">All critical risks are being managed within normal operational workflows.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {levels.map((lvl) => {
            const hasItems = lvl.count > 0;
            return (
              <div
                key={lvl.level}
                className={`rounded-lg border p-3 transition ${
                  hasItems ? 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]/50' : 'border-[var(--psm-line)]/50 bg-transparent opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--psm-muted)]">Level {lvl.level}</span>
                  <span className={`h-2 w-2 rounded-full ${lvl.color}`} />
                </div>
                <div className="mt-2 text-lg font-bold text-[var(--psm-text)]">{lvl.count}</div>
                <div className="mt-0.5 text-[10px] text-[var(--psm-muted)] truncate" title={lvl.label}>
                  {lvl.label.split(':')[1]?.trim() ?? lvl.label}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--psm-surface-2)]">
                  <div
                    className={`h-full rounded-full ${lvl.color}`}
                    style={{ width: `${(lvl.count / maxLevelCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
