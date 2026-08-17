import { TrainingBadge } from './TrainingUi';
export function TrainingEsignatureStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? 'Not Required';
  return <TrainingBadge tone={text === 'Signed' || text === 'Completed' ? 'good' : text === 'Pending' ? 'warn' : text === 'Failed' ? 'danger' : 'neutral'}>{text}</TrainingBadge>;
}
