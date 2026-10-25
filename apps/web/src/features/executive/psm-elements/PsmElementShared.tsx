'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ExecutivePerformanceStatusBadge } from '../components/shared/ExecutivePerformanceStatusBadge';
import type { PsmElementGap, PsmElementRow, PsmElementScore, PsmScoreFactor, PsmSourceTrace } from '../types/executive-psm-element.types';

export const panelClass = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4';
export const primaryButton = 'rounded-md bg-[var(--psm-primary)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButton = 'rounded-md border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] disabled:cursor-not-allowed disabled:opacity-60';

export function PsmState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <section className={panelClass}><h2 className="font-semibold text-[var(--psm-text)]">{title}</h2><p className="mt-1 text-sm text-[var(--psm-muted)]">{message}</p>{action ? <div className="mt-4">{action}</div> : null}</section>;
}

export function PsmScoreCards({ rows }: { rows: Array<PsmElementScore | PsmElementRow> }) {
  if (!rows.length) return <PsmState title="No PSM elements" message="No permitted PSM element definitions are available in this workspace." />;
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{rows.map((row) => <Link href={`/executive/psm-elements/${row.element_id ?? row.id}`} key={row.element_id ?? row.id} className={`${panelClass} transition-colors hover:border-[var(--psm-primary)]`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-[var(--psm-text)]">{row.element_name}</p><p className="mt-2 text-3xl font-bold text-[var(--psm-text)]">{row.score_value ?? '—'}</p></div>{row.element_status ? <ExecutivePerformanceStatusBadge status={row.element_status} /> : null}</div><p className="mt-3 text-xs text-[var(--psm-muted)]">Critical {row.critical_item_count ?? 0} · Overdue {row.overdue_action_count ?? 0} · Stale {row.stale_record_count ?? 0}</p></Link>)}</section>;
}

export function PsmFactorTable({ factors }: { factors: PsmScoreFactor[] }) {
  if (!factors.length) return <PsmState title="No score factors" message="A score factor breakdown will appear after an aggregation calculates this element." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="pb-2">Factor</th><th className="pb-2">Value</th><th className="pb-2">Weight</th><th className="pb-2">Source count</th><th className="pb-2">Status</th></tr></thead><tbody>{factors.map((factor) => <tr className="border-b border-[var(--psm-line)] last:border-0" key={factor.id}><td className="py-3 font-medium">{factor.factor_title}</td><td>{factor.factor_value ?? factor.factor_text_value ?? '—'}</td><td>{factor.factor_weight ?? '—'}</td><td>{factor.source_count}</td><td>{factor.factor_status}</td></tr>)}</tbody></table></div>;
}

export function PsmGapTable({ gaps }: { gaps: PsmElementGap[] }) {
  if (!gaps.length) return <PsmState title="No open gaps" message="No permitted PSM element gaps are open for this scope." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="pb-2">Gap</th><th className="pb-2">Module</th><th className="pb-2">Severity</th><th className="pb-2">Due</th><th className="pb-2">Status</th></tr></thead><tbody>{gaps.map((gap) => <tr key={gap.id} className="border-b border-[var(--psm-line)] last:border-0"><td className="py-3 font-medium">{gap.gap_title}</td><td>{gap.source_module}</td><td><ExecutivePerformanceStatusBadge status={gap.severity} /></td><td>{gap.due_date ? new Date(gap.due_date).toLocaleDateString() : '—'}</td><td>{gap.gap_status}</td></tr>)}</tbody></table></div>;
}

export function PsmSourceTraceTable({ rows }: { rows: PsmSourceTrace[] }) {
  if (!rows.length) return <PsmState title="No source trace" message="No permitted source records were captured for this score yet." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="pb-2">Module</th><th className="pb-2">Record</th><th className="pb-2">Contribution</th><th className="pb-2">Status</th><th className="pb-2">Access</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)] last:border-0"><td className="py-3 font-medium">{row.source_module}</td><td>{row.restricted ? 'Restricted source record' : row.source_title ?? row.source_record_type}</td><td>{row.contribution_type ?? '—'}</td><td>{row.status ?? row.severity ?? '—'}</td><td>{row.restricted ? 'Restricted' : row.included ? 'Included' : row.excluded_reason ?? 'Excluded'}</td></tr>)}</tbody></table></div>;
}
