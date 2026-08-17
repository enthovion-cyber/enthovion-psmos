import { badgeClass } from './badge-utils';

export function ExportStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Queued';
  const tone = /completed|ready/i.test(value) ? 'success' : /failed|cancelled/i.test(value) ? 'danger' : /queued|running|building/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
