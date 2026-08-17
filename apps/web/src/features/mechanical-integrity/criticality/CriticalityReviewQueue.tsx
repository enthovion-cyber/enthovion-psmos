import type { CriticalityAssessment } from '../types/criticality.types';

export function CriticalityReviewQueue({ rows, onOpen }: { rows: CriticalityAssessment[]; onOpen: (row: CriticalityAssessment) => void }) {
  const queue = rows.filter((row) => row.approval_status === 'Pending Review').slice(0, 5);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-semibold">Review Queue</div>
      <div className="mt-3 space-y-2">
        {queue.length ? queue.map((row) => <button key={row.id} className="block w-full rounded-md border border-border p-3 text-left text-sm" onClick={() => onOpen(row)}>{row.assessment_number}<span className="ml-2 text-muted-foreground">{row.equipmentTag}</span></button>) : <div className="text-sm text-muted-foreground">No criticality assessments are pending review.</div>}
      </div>
    </div>
  );
}
