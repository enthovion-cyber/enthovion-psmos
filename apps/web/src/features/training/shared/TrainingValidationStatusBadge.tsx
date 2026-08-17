import { TrainingBadge } from './TrainingUi';
export function TrainingValidationStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? 'Not Run';
  return <TrainingBadge tone={text === 'Passed' ? 'good' : text === 'Passed With Warnings' ? 'warn' : ['Failed', 'Stale'].includes(text) ? 'danger' : 'info'}>{text}</TrainingBadge>;
}
