import { badgeClass } from './badge-utils';

export function StartupBlockedBadge({ blocked }: { blocked?: boolean | null | undefined }) {
  return <span className={badgeClass(blocked ? 'danger' : 'success')}>{blocked ? 'Startup Blocked' : 'Startup Allowed'}</span>;
}
