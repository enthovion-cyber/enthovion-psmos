import { badgeClass } from './badge-utils';

export function HistoryEventTypeBadge({ type }: { type?: string | null | undefined }) {
  const value = type || 'Event';
  const tone = /failed|overdue|expired|blocked|critical/i.test(value) ? 'danger' : /approved|completed|closed|generated/i.test(value) ? 'success' : /submitted|updated|changed|linked/i.test(value) ? 'info' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
