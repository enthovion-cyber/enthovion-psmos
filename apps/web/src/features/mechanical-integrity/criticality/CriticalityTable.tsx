'use client';

import { CriticalityBadge } from '../shared/CriticalityBadge';
import { RiskScoreBadge } from '../shared/RiskScoreBadge';
import { RiskTrendBadge } from '../shared/RiskTrendBadge';
import type { CriticalityAssessment } from '../types/criticality.types';

export function CriticalityTable({ rows, onOpen }: { rows: CriticalityAssessment[]; onOpen: (row: CriticalityAssessment) => void }) {
  if (!rows.length) return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No criticality assessments match the current filters.</div>;
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr><th className="p-3">Assessment</th><th className="p-3">Equipment</th><th className="p-3">Score</th><th className="p-3">Category</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Trend</th><th className="p-3">Next Review</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border hover:bg-muted/30" onClick={() => onOpen(row)}>
              <td className="p-3 font-medium">{row.assessment_number}</td>
              <td className="p-3">{row.equipmentTag ?? row.equipment_id}<div className="text-xs text-muted-foreground">{row.equipmentName}</div></td>
              <td className="p-3"><RiskScoreBadge value={row.final_risk_score} /></td>
              <td className="p-3"><CriticalityBadge value={row.criticality_category} /></td>
              <td className="p-3">{row.inspection_priority ?? 'Pending'}</td>
              <td className="p-3">{row.status}<div className="text-xs text-muted-foreground">{row.approval_status}</div></td>
              <td className="p-3"><RiskTrendBadge value={row.risk_change_direction} /></td>
              <td className="p-3">{row.next_review_due ?? 'Not set'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
