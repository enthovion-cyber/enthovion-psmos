'use client';

import { CriticalityBadge } from '../shared/CriticalityBadge';
import { RiskScoreBadge } from '../shared/RiskScoreBadge';
import type { CriticalityAssessment } from '../types/criticality.types';

export function CriticalityMobileCards({ rows, onOpen }: { rows: CriticalityAssessment[]; onOpen: (row: CriticalityAssessment) => void }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <button key={row.id} className="rounded-xl border border-border bg-card p-4 text-left" onClick={() => onOpen(row)}>
          <div className="font-semibold">{row.assessment_number}</div>
          <div className="mt-1 text-sm text-muted-foreground">{row.equipmentTag} - {row.equipmentName}</div>
          <div className="mt-3 flex flex-wrap gap-2"><RiskScoreBadge value={row.final_risk_score} /><CriticalityBadge value={row.criticality_category} /><span className="text-xs text-muted-foreground">{row.status}</span></div>
        </button>
      ))}
    </div>
  );
}
