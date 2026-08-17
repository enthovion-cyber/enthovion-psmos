import { badgeClass } from './badge-utils';

export function VerificationStatusBadge({ status, required }: { status?: string | null | undefined; required?: boolean | null | undefined }) {
  const value = status || (required ? 'Pending Verification' : 'Not Required');
  const tone = value === 'Accepted' || value === 'Verified' || value === 'Not Required' ? 'success' : value === 'Rejected' || value === 'Verification Failed' ? 'danger' : 'warning';
  return <span className={badgeClass(tone)}>{value}</span>;
}
