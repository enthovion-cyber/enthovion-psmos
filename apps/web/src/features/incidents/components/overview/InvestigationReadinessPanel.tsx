import { Badge } from '../shared/IncidentStatusBadge';
import { ReadinessBadge } from '../shared/ReadinessBadge';
import type { IncidentReadiness } from '../../types/incident-readiness.types';
import { OverviewEmptyState } from './OverviewEmptyState';
import { OverviewPanelShell } from './OverviewPanelShell';
export function InvestigationReadinessPanel({ readiness }: { readiness?: IncidentReadiness }) {
  return <OverviewPanelShell title="Investigation Status & Readiness Panel" subtitle={`${readiness?.score ?? 0}% · ${readiness?.status ?? 'Not Ready'}`} action={<ReadinessBadge value={readiness?.status} />}>{readiness?.checklist?.length ? <div className="grid gap-2">{readiness.checklist.map((check) => <div key={check.title} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><span>{check.title}</span><Badge value={check.status}/></div>)}</div> : <OverviewEmptyState message="No readiness checklist returned by backend."/>}</OverviewPanelShell>;
}
