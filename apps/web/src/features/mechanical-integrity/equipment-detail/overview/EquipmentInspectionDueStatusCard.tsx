import { InspectionDueStatusBadge } from '../../shared/InspectionDueStatusBadge';
import { SchedulerStatusBadge } from '../../shared/SchedulerStatusBadge';

export function EquipmentInspectionDueStatusCard({ summary }: { summary?: Record<string, unknown> | null }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="font-bold text-[var(--psm-text)]">Inspection Due Status</h3><div className="mt-3 space-y-2 text-sm"><div className="text-[var(--psm-text)]">Next due: <strong>{String(summary?.currentNextInspectionDue ?? 'Not scheduled')}</strong></div><InspectionDueStatusBadge value={String(summary?.dueStatus ?? '')} /><SchedulerStatusBadge value={String(summary?.schedulerStatus ?? '')} /><div className="text-xs text-[var(--psm-muted)]">Basis: {String(summary?.scheduleBasis ?? 'No basis')}</div></div></div>;
}
