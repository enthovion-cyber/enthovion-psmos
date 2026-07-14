'use client';

import { ActualSeverityBadge } from '../shared/ActualSeverityBadge';
import { IncidentClassificationBadge } from '../shared/IncidentClassificationBadge';
import { Badge, IncidentStatusBadge } from '../shared/IncidentStatusBadge';
import { InvestigationPriorityBadge } from '../shared/InvestigationPriorityBadge';
import { PotentialSeverityBadge } from '../shared/PotentialSeverityBadge';
import { PseTierBadge } from '../shared/PseTierBadge';
import { PsmIncidentBadge } from '../shared/PsmIncidentBadge';
import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';

export function EventDetailsHeader({ data, saving, canSave, canRequest, disabledReason, requestDisabledReason, message, onSave, onRequestReview, onRefresh }: any) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Event Details & Classification</h2>
            <IncidentStatusBadge status={data.header?.status} />
            <IncidentClassificationBadge value={data.header?.classification} />
            <PseTierBadge value={data.header?.apiRp754Tier} />
            <PsmIncidentBadge value={data.header?.isPsmIncident} />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.header?.incidentNumber} - {data.header?.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActualSeverityBadge value={data.header?.actualSeverity} />
            <PotentialSeverityBadge value={data.header?.potentialSeverity} />
            <InvestigationPriorityBadge value={data.header?.investigationPriority} />
            <Badge value={`Updated ${formatDate(data.header?.lastUpdated)}`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onSave} disabled={!canSave || saving} title={disabledReason ?? 'Save changes'} className={buttonPrimary}>Save Changes</button>
          <button onClick={onRequestReview} disabled={!canRequest || saving} title={requestDisabledReason ?? 'Request review'} className={buttonSecondary}>Request Classification Review</button>
          <button onClick={onRefresh} disabled={saving} className={buttonSecondary}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}
