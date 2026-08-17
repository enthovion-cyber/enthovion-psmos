import { TrainingBadge } from './TrainingUi';

export function PssrTrainingBlockerBadge({ status, type, value: rawValue }: { status?: string | null | undefined; type?: string | null | undefined; value?: boolean | string | null | undefined }) {
  const value = status ?? type ?? (typeof rawValue === 'boolean' ? (rawValue ? 'PSSR Blocker' : 'No PSSR Blocker') : rawValue) ?? 'Open';
  const tone = ['Resolved', 'Verified', 'Waived'].includes(value) ? 'good' : ['Open', 'Reopened'].includes(value) ? 'danger' : 'warn';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}

export const PSSRTrainingBlockerBadge = PssrTrainingBlockerBadge;

