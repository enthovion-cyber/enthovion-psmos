import { Badge } from '../shared/IncidentStatusBadge';
import { formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function ReviewCommentsDecisionLogPanel({ decisions }: { decisions: any[] }) {
  return (
    <TabPanel title="Review Comments / Decision Log">
      <div className="grid gap-2">
        {(decisions ?? []).length ? decisions.map((decision) => (
          <div key={decision.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="flex items-start justify-between gap-3"><b>{decision.decision}</b><Badge value={decision.decision} /></div>
            <p className="mt-1 text-slate-500">{decision.comments ?? decision.reason ?? 'No comment supplied.'}</p>
            <div className="mt-2 text-slate-400">By {decision.decided_by ?? decision.actor_user_id ?? '-'} · {formatDate(decision.decided_at ?? decision.created_at)}</div>
          </div>
        )) : <p className="text-xs text-slate-500">No review comments, decisions, or change requests have been recorded.</p>}
      </div>
    </TabPanel>
  );
}
