import { badgeClass } from './badge-utils';

export function MocRequiredBadge({ required }: { required?: boolean | null | undefined }) {
  return <span className={badgeClass(required ? 'warning' : 'neutral')}>{required ? 'MOC Required' : 'No MOC Trigger'}</span>;
}
