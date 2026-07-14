'use client';

import { ActualSeverityBadge } from '../shared/ActualSeverityBadge';
import { Badge } from '../shared/IncidentStatusBadge';
import { InvestigationLevelBadge } from '../shared/InvestigationLevelBadge';
import { InvestigationPriorityBadge } from '../shared/InvestigationPriorityBadge';
import { PotentialRiskScoreBadge } from '../shared/PotentialRiskScoreBadge';
import { PotentialSeverityBadge } from '../shared/PotentialSeverityBadge';
import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';

export function PotentialSeverityHeader({ data, saving, action, message, onRecalculate, onRequestReview, onSave, onRefresh }: any) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Potential Severity / Risk Matrix</h2>
            <ActualSeverityBadge value={data.header?.actualSeverity} />
            <PotentialSeverityBadge value={data.header?.potentialSeverity} />
            <PotentialRiskScoreBadge value={data.header?.potentialRiskScore} />
            <InvestigationPriorityBadge value={data.header?.investigationPriority} />
            <InvestigationLevelBadge value={data.header?.investigationLevelRequired} />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.header?.incidentNumber} - backend-calculated potential risk and investigation priority.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge value={data.header?.highPotentialNearMiss ? 'High-Potential Near Miss' : 'High Potential Not Flagged'} />
            <Badge value={data.header?.fatalityPotential ? 'Fatality Potential' : 'No Fatality Potential'} />
            <Badge value={data.header?.majorProcessSafetyPotential ? 'Major PSM Potential' : 'No Major PSM Potential'} />
            <Badge value={`Matrix ${data.header?.riskMatrixVersion ?? 'Not Available'}`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRecalculate} disabled={!action('recalculate')?.enabled || saving} title={action('recalculate')?.disabledReason ?? 'Recalculate risk'} className={buttonSecondary}>Recalculate Risk</button>
          <button onClick={onRequestReview} disabled={!action('request-severity-review')?.enabled || saving} title={action('request-severity-review')?.disabledReason ?? 'Request review'} className={buttonSecondary}>Request Severity Review</button>
          <button onClick={onSave} disabled={!action('save')?.enabled || saving} title={action('save')?.disabledReason ?? 'Save changes'} className={buttonPrimary}>Save Changes</button>
          <button onClick={onRefresh} disabled={saving} className={buttonSecondary}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}
