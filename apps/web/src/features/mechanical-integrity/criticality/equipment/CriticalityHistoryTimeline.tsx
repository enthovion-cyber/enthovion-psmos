import type { CriticalityAssessment } from '../../types/criticality.types';

export function CriticalityHistoryTimeline({ rows }: { rows: CriticalityAssessment[] }) {
  return <div className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Criticality History</h2><div className="mt-3 space-y-2">{rows.length ? rows.map((row) => <div key={row.id} className="rounded-md border border-border p-3 text-sm">{row.assessment_number} - {row.status} - {row.criticality_category ?? 'Not calculated'}</div>) : <div className="text-sm text-muted-foreground">No criticality assessment history yet.</div>}</div></div>;
}
