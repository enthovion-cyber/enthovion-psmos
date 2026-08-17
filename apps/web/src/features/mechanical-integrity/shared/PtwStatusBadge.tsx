import { badgeClass } from './badge-utils';

export function PtwStatusBadge({ required, linked }: { required?: boolean | null | undefined; linked?: string | null | undefined }) {
  const value = !required ? 'PTW Not Required' : linked ? 'PTW Linked' : 'Waiting PTW';
  return <span className={badgeClass(!required || linked ? 'success' : 'warning')}>{value}</span>;
}
