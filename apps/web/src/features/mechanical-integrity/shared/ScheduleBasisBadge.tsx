import { badgeClass } from './badge-utils';

export function ScheduleBasisBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value ? 'info' : 'neutral')}>{value ?? 'No basis'}</span>;
}
