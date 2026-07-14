'use client';

import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';
import type { HazopCoverageRow } from '../../types/hazop-team.types';

export function HazopDisciplineCoveragePanel({ rows }: { rows: HazopCoverageRow[] }) {
  const missing = rows.filter((row) => row.coverage_status === 'Missing').length;
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <div>
          <h3 className="font-semibold">Required Discipline Coverage</h3>
          <p className="text-xs text-[var(--psm-muted)]">Policy-driven cross-functional HAZOP participation.</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${missing ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{missing} missing</span>
      </div>

      <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
        {rows.map((row) => {
          const covered = row.coverage_status === 'Covered';
          const optional = row.coverage_status === 'Optional' || !row.required;
          const Icon = covered ? CheckCircle2 : optional ? CircleDashed : AlertTriangle;
          return (
            <article key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold">{row.discipline}</h4>
                    <span className="rounded-md border border-[var(--psm-line)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--psm-muted)]">{row.required ? 'Required' : 'Optional'}</span>
                  </div>
                  <dl className="mt-2 grid gap-1 text-xs text-[var(--psm-muted)]">
                    <div className="flex justify-between gap-3"><dt>Assigned</dt><dd className="text-right text-[var(--psm-text)]">{row.assignedMember?.display_name ?? row.assignedMember?.name ?? '-'}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Status</dt><dd className={covered ? 'text-emerald-200' : optional ? 'text-slate-300' : 'text-amber-200'}>{row.coverage_status}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Source</dt><dd className="text-right">{row.requirement_source ?? 'Site policy'}</dd></div>
                  </dl>
                  {!covered && row.missing_reason ? <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-100">{row.missing_reason}</p> : null}
                </div>
                <Icon className={covered ? 'text-emerald-300' : optional ? 'text-slate-400' : 'text-amber-300'} size={18} />
              </div>
            </article>
          );
        })}
        {!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">Coverage policy has not generated requirements yet.</div> : null}
      </div>
    </section>
  );
}
