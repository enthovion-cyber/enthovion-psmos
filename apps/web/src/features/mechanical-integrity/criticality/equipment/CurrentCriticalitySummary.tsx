import { CriticalityBadge } from '../../shared/CriticalityBadge';
import { RiskScoreBadge } from '../../shared/RiskScoreBadge';
import type { CriticalityAssessment } from '../../types/criticality.types';

export function CurrentCriticalitySummary({ current }: { current?: CriticalityAssessment | null }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Current Approved Criticality</h2>
      {current ? <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
        <div><span className="text-muted-foreground">Assessment</span><div className="font-medium">{current.assessment_number}</div></div>
        <div><span className="text-muted-foreground">Score</span><div className="mt-1"><RiskScoreBadge value={current.final_risk_score} /></div></div>
        <div><span className="text-muted-foreground">Category</span><div className="mt-1"><CriticalityBadge value={current.criticality_category} /></div></div>
        <div><span className="text-muted-foreground">Next Review</span><div className="font-medium">{current.next_review_due ?? 'Not set'}</div></div>
      </div> : <div className="mt-3 text-sm text-muted-foreground">No approved criticality assessment exists for this equipment.</div>}
    </section>
  );
}
