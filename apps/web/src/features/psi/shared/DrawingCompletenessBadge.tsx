import { DrawingBadgeBase } from './DrawingBadgeBase';

export function DrawingCompletenessBadge({ value, score }: { value?: string | null; score?: number | null }) {
  const tone = value === 'Complete' ? 'good' : value === 'Critical Gaps' ? 'danger' : ['Incomplete', 'Review Overdue'].includes(String(value)) ? 'warn' : 'neutral';
  return <DrawingBadgeBase tone={tone}>{value ?? 'Not reviewed'}{score !== null && score !== undefined ? ` ${score}%` : ''}</DrawingBadgeBase>;
}
