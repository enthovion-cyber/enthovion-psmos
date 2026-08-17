import { badgeClass } from './badge-utils';

export function LotoStatusBadge({ required, linked }: { required?: boolean | null | undefined; linked?: string | null | undefined }) {
  const value = !required ? 'LOTO Not Required' : linked ? 'LOTO Linked' : 'Waiting LOTO';
  return <span className={badgeClass(!required || linked ? 'success' : 'warning')}>{value}</span>;
}
