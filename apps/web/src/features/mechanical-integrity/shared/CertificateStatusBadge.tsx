import { badgeClass, labelValue } from './badge-utils';

export function CertificateStatusBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Certificate Missing';
  const tone = /linked|approved|available/i.test(text) ? 'success' : /missing|required/i.test(text) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(text)}</span>;
}
