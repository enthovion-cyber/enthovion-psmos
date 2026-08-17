'use client';

import { TrainingCard, TrainingEmptyState } from '../../../shared/TrainingUi';

export function SessionLinkedGapsTab({ rows }: { rows: Record<string, any>[] }) {
  return <TrainingCard title="Linked Gaps / Matrix / Competency">{!rows.length ? <TrainingEmptyState title="No links returned" message="No PTW, MOC, PSSR, SOP, PSI, HAZOP, equipment, matrix, competency, or Document Control links exist for this session." /> : <div className="grid gap-3 md:grid-cols-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><b>{row.link_type}</b><p className="text-[var(--psm-muted)]">{row.linked_record_title ?? row.linked_record_id}</p></div>)}</div>}</TrainingCard>;
}
