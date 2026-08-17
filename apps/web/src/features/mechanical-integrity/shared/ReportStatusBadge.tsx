import { badgeClass } from './badge-utils';

export function ReportStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Draft';
  const tone = /generated|completed|delivered/i.test(value) ? 'success' : /failed|error/i.test(value) ? 'danger' : /queued|running|generating|scheduled/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
