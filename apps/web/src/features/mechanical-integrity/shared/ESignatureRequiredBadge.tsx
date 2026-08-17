import { badgeClass } from './badge-utils';

export function ESignatureRequiredBadge({ required }: { required?: boolean | null | undefined }) {
  return <span className={badgeClass(required ? 'warning' : 'neutral')}>{required ? 'E-Signature Required' : 'No E-Signature Required'}</span>;
}
