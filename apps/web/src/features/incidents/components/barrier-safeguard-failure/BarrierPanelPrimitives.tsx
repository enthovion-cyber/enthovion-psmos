'use client';

import { Badge } from '../shared/IncidentStatusBadge';
import { InfoRows, ReadinessContent, SummaryCardGrid, TabPanel, TimelineList, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { BarrierPerformanceBadge } from '../shared/BarrierPerformanceBadge';
import { BarrierTypeBadge } from '../shared/BarrierTypeBadge';
import { IplCreditBadge } from '../shared/IplCreditBadge';

export function SimpleBarrierPanel({ title, data, empty = 'No backend records were returned for this panel.' }: { title: string; data: any; empty?: string }) {
  const rows = Array.isArray(data) ? data : data?.rows ?? [];
  return <TabPanel title={title}>
    <div className="grid gap-3">
      {data?.status ? <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Backend status</span><Badge value={data.status} /></div> : null}
      {data?.warning ? <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-200">{data.warning}</div> : null}
      <TimelineList rows={rows} empty={empty} columns />
    </div>
  </TabPanel>;
}

export function BarrierCards({ cards }: { cards: any[] }) {
  return <SummaryCardGrid cards={cards ?? []} />;
}

export function BarrierTable({ rows, onEdit, onDelete, onEvidence, onRca, onFollowup }: { rows: any[]; onEdit?: (row: any) => void; onDelete?: (row: any) => void; onEvidence?: (row: any) => void; onRca?: (row: any) => void; onFollowup?: (row: any) => void }) {
  if (!rows?.length) return <p className="text-xs text-slate-500">No barrier/safeguard records exist yet. Add one or import from real HAZOP/LOPA/IPL sources.</p>;
  return <div className="overflow-x-auto">
    <table className="min-w-full text-left text-xs">
      <thead className="text-[11px] uppercase text-slate-500">
        <tr><th className="p-2">Barrier</th><th className="p-2">Type</th><th className="p-2">Function</th><th className="p-2">Demand</th><th className="p-2">Performance</th><th className="p-2">IPL</th><th className="p-2">Review</th><th className="p-2">Actions</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.id} className="border-t border-slate-200 dark:border-cyan-300/10">
          <td className="p-2 font-bold"><div>{row.barrier_number ?? '-'}</div><div>{row.barrier_name}</div><div className="text-[11px] text-slate-500">{row.related_hazard}</div></td>
          <td className="p-2"><BarrierTypeBadge value={row.barrier_type} /></td>
          <td className="max-w-[260px] p-2 text-slate-600 dark:text-slate-300">{row.expected_function}</td>
          <td className="p-2">{row.demand_occurred ?? '-'}</td>
          <td className="p-2"><BarrierPerformanceBadge value={row.performance_status} /></td>
          <td className="p-2"><IplCreditBadge value={row.credited_ipl} /></td>
          <td className="p-2"><Badge value={row.review_status ?? 'Not Requested'} /></td>
          <td className="p-2"><div className="flex flex-wrap gap-1">
            <button className={buttonSecondary} onClick={() => onEdit?.(row)}>Edit</button>
            <button className={buttonSecondary} onClick={() => onEvidence?.(row)}>Evidence</button>
            <button className={buttonSecondary} onClick={() => onRca?.(row)}>RCA</button>
            <button className={buttonSecondary} onClick={() => onFollowup?.(row)}>Action</button>
            <button className={buttonSecondary} onClick={() => onDelete?.(row)}>Supersede</button>
          </div></td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

export function BarrierReadinessContent({ readiness }: { readiness: any }) {
  return <ReadinessContent readiness={readiness} />;
}

export function BarrierHeaderFacts({ header }: { header: any }) {
  return <InfoRows rows={[
    ['Incident', `${header?.incidentNumber ?? '-'} - ${header?.incidentTitle ?? '-'}`],
    ['Status', header?.incidentStatus],
    ['Actual / Potential severity', `${header?.actualSeverity ?? '-'} / ${header?.potentialSeverity ?? '-'}`],
    ['PSM/PSE/Tier', `${header?.psmIncident ? 'PSM' : 'No PSM'} / ${header?.processSafetyEvent ? 'PSE' : 'No PSE'} / ${header?.apiRp754Tier ?? 'Not Determined'}`],
    ['Last updated', formatDate(header?.lastUpdated)]
  ]} />;
}
