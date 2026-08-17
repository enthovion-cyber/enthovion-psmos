import { badgeClass } from './badge-utils';

export function BypassStatusBadge({ active }: { active?: boolean | null | undefined }) {
  return <span className={badgeClass(active ? 'danger' : 'success')}>{active ? 'Active Bypass' : 'No Active Bypass'}</span>;
}
