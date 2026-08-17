import { DrawingBadgeBase } from './DrawingBadgeBase';

export function DrawingConflictBadge({ value }: { value?: string | null }) {
  const tone = value === 'No Conflict' ? 'good' : value === 'Critical Conflict' ? 'danger' : ['Major Conflict', 'Warning'].includes(String(value)) ? 'warn' : 'neutral';
  return <DrawingBadgeBase tone={tone}>{value ?? 'Not checked'}</DrawingBadgeBase>;
}
