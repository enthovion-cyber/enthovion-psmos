import { badgeClass } from './badge-utils';

export function InspectionStatusBadge({ value }: { value?: string | null | undefined }) {
  const normalized = value ?? 'Not configured';
  const tone = /overdue/i.test(normalized) ? 'danger' : /scheduled|complete|current/i.test(normalized) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{normalized}</span>;
}
