import { TrainingBadge } from './TrainingUi';

export function TrainingGapStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Open';
  const tone = ['Closed', 'Verified', 'Waived'].includes(status) ? 'good' : ['Open', 'Reopened', 'Waiver Requested'].includes(status) ? 'warn' : 'info';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
