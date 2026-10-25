import Link from 'next/link';
import type { PsmElementGap, PsmElementSnapshot } from '../types/executive-psm-element.types';
import { PsmGapTable, PsmState, panelClass } from './PsmElementShared';

export function PsmHeatmap({ cells }: { cells: Array<{ elementId: string; elementName: string; score: number | null; status: string; criticalCount: number; overdueCount: number; restricted: boolean; drilldownRoute: string }> }) {
  if (!cells.length) return <PsmState title="No heatmap data" message="No permitted PSM element scores are available for this scope." />;
  return <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cells.map((cell) => <Link key={cell.elementId} href={cell.drilldownRoute} className={`${panelClass} hover:border-[var(--psm-primary)]`}><p className="font-semibold">{cell.elementName}</p><p className="mt-2 text-3xl font-bold">{cell.score ?? '—'}</p><p className="mt-2 text-sm text-[var(--psm-muted)]">{cell.status} · Critical {cell.criticalCount} · Overdue {cell.overdueCount}</p></Link>)}</section>;
}

export function PsmSnapshotTable({ rows }: { rows: PsmElementSnapshot[] }) {
  if (!rows.length) return <PsmState title="No snapshots" message="Create a snapshot only after the required PSM element scores are available." />;
  return <section className={`${panelClass} overflow-x-auto`}><table className="w-full min-w-[740px] text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="pb-2">Snapshot</th><th className="pb-2">Scope</th><th className="pb-2">Elements</th><th className="pb-2">Critical</th><th className="pb-2">Generated</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)] last:border-0"><td className="py-3"><Link className="font-medium text-[var(--psm-primary)]" href={`/executive/psm-elements/snapshots/${row.id}`}>{row.snapshot_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.snapshot_code ?? 'Snapshot'}</p></td><td>{row.scope_type}</td><td>{row.element_count}</td><td>{row.critical_count}</td><td>{new Date(row.generated_at).toLocaleString()}</td></tr>)}</tbody></table></section>;
}

export function PsmBreakdownTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  if (!rows.length) return <PsmState title={`No ${title.toLowerCase()}`} message="No permitted scope records are available." />;
  return <section className={`${panelClass} overflow-x-auto`}><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="pb-2">Scope</th><th className="pb-2">Score</th><th className="pb-2">Weakest element</th><th className="pb-2">Critical elements</th><th className="pb-2">Data quality</th></tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-b border-[var(--psm-line)] last:border-0"><td className="py-3 font-medium">{String(row.label ?? '—')}</td><td>{String(row.overallScore ?? '—')}</td><td>{String(row.weakestElement ?? '—')}</td><td>{String(row.criticalElementCount ?? 0)}</td><td>{String(row.dataQuality ?? '—')}</td></tr>)}</tbody></table></section>;
}

export function PsmGaps({ gaps }: { gaps: PsmElementGap[] }) { return <PsmGapTable gaps={gaps} />; }
