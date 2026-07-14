import { Badge } from '../shared/IncidentStatusBadge';
import { ReadinessBadge } from '../shared/ReadinessBadge';
import { formatDate } from './OverviewPanelShell';

export function OverviewHeader({ header, actions = [] }: { header?: Record<string, any>; actions?: any[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{header?.title ?? 'Overview'}</h2>
          <p className="text-sm text-slate-500">{header?.subtitle ?? 'Incident summary, severity, investigation status, actions, and required follow-ups'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge value={header?.incidentNumber} />
            <Badge value={header?.currentStatus} />
            <ReadinessBadge value={header?.readinessStatus} />
            <Badge value={`${header?.readinessScore ?? 0}% ready`} />
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs sm:items-end">
          <span className="text-slate-500">Owner: {header?.investigationOwner?.displayName ?? '-'}</span>
          <span className="text-slate-500">Due: {header?.dueDate ?? '-'}</span>
          <span className="text-slate-500">Updated: {formatDate(header?.lastUpdated)}</span>
          <div className="flex flex-wrap gap-2">
            {actions.filter((action) => ['edit-basic', 'create-action', 'upload-evidence', 'refresh'].includes(action.key)).map((action) => (
              <button key={action.key} disabled={!action.enabled} title={action.disabledReason ?? action.label} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-300/10">
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
