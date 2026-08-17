'use client';

import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';

export function WorkOrderTasksPanel({ tasks = [] }: { tasks?: Array<Record<string, unknown>> | undefined }) {
  return <SectionCard title="Tasks" description="Job steps, required tasks, evidence requirements, assignments, and completion state.">{!tasks.length ? <p className="text-sm text-[var(--psm-muted)]">No tasks recorded.</p> : <div className="space-y-2">{tasks.map((task) => <div key={String(task.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{cardValue(task.task_number)} - {cardValue(task.task_title)}</p><p className="text-[var(--psm-muted)]">Status: {cardValue(task.status)} · Required: {cardValue(task.required)} · Evidence: {cardValue(task.evidence_required)}</p></div>)}</div>}</SectionCard>;
}
