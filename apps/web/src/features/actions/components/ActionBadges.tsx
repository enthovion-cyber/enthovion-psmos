import type { ActionPriority, ActionStatus } from '@/services/actions.service';

export function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const cls = priority === 'SAFETY_CRITICAL' ? 'psm-badge-danger' : priority === 'HIGH' ? 'psm-badge-warning' : priority === 'MEDIUM' ? 'psm-badge-info' : 'psm-badge-success';
  return <span className={`psm-badge ${cls}`}>{priority.replace('_', ' ')}</span>;
}

export function StatusBadge({ status }: { status: ActionStatus }) {
  const cls = status === 'CLOSED' ? 'psm-badge-success' : status === 'CANCELLED' ? 'psm-badge-muted' : status === 'PENDING_VERIFICATION' ? 'psm-badge-info' : status === 'IN_PROGRESS' ? 'psm-badge-warning' : 'psm-badge-danger';
  return <span className={`psm-badge ${cls}`}>{status.replace('_', ' ')}</span>;
}

export function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
