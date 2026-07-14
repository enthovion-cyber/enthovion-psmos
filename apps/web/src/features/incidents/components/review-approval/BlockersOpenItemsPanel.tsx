import { BlockerSeverityBadge } from '../shared/BlockerSeverityBadge';
import { Badge } from '../shared/IncidentStatusBadge';
import { buttonSecondary, formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function BlockersOpenItemsPanel({ blockers, onOverride }: any) {
  return (
    <TabPanel title="Open Blockers / Required Actions">
      <div className="grid gap-2">
        {(blockers ?? []).length ? blockers.map((blocker: any) => (
          <div key={blocker.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><b>{blocker.description}</b><div className="text-slate-500">{blocker.source_tab ?? blocker.sourceTab ?? '-'} · {blocker.blocker_type ?? blocker.blockerType ?? '-'}</div></div>
              <div className="flex flex-wrap gap-2"><BlockerSeverityBadge value={blocker.severity} /><Badge value={blocker.status ?? 'Open'} /></div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-slate-500"><span>Owner: {blocker.owner_id ?? '-'} · Due: {formatDate(blocker.due_date)}</span><button className={buttonSecondary} onClick={() => onOverride(blocker)}>Accept Exception</button></div>
          </div>
        )) : <p className="text-xs text-slate-500">No open blockers were returned by the backend readiness engine.</p>}
      </div>
    </TabPanel>
  );
}
