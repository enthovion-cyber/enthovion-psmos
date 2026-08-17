'use client';

import { CriticalityBadge } from '../../shared/CriticalityBadge';
import { RiskScoreBadge } from '../../shared/RiskScoreBadge';
import type { CriticalityAssessment } from '../../types/criticality.types';

export function CriticalityAssessmentHeader({ assessment, onAction, saving }: { assessment: CriticalityAssessment; onAction: (key: string) => void; saving?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div><h1 className="text-xl font-semibold">{assessment.assessment_number}</h1><p className="text-sm text-muted-foreground">{assessment.equipmentTag ?? assessment.equipment_id} - {assessment.assessment_reason}</p></div>
        <div className="flex flex-wrap gap-2"><RiskScoreBadge value={assessment.final_risk_score} /><CriticalityBadge value={assessment.criticality_category} /><span className="rounded-full border border-border px-3 py-1 text-xs">{assessment.status}</span></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['recalculate','submit','approve','reject','return','revision','archive'].map((key) => <button key={key} className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50" disabled={saving} onClick={() => onAction(key)}>{key}</button>)}
      </div>
    </div>
  );
}
