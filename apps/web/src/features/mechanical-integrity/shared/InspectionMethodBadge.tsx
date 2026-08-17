import { badgeClass } from './badge-utils';

export function InspectionMethodBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass('neutral')}>{value ?? 'Method not set'}</span>;
}
