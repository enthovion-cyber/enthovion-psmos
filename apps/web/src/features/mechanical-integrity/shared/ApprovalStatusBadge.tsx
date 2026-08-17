import { badgeClass } from './badge-utils';

export function ApprovalStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Not submitted';
  const tone = /approved|completed/i.test(value)
    ? 'success'
    : /rejected|cancelled|expired|overdue/i.test(value)
      ? 'danger'
      : /returned|requested|delegated|escalated|pending|review|submitted/i.test(value)
        ? 'warning'
        : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
