import { TrainingBadge } from './TrainingUi';

export function TrainingGapSeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? 'Info';
  const tone = ['Critical', 'Work Blocker', 'Startup Blocker'].includes(severity) ? 'danger' : severity === 'High' ? 'warn' : severity === 'Medium' ? 'info' : 'neutral';
  return <TrainingBadge tone={tone}>{severity}</TrainingBadge>;
}
