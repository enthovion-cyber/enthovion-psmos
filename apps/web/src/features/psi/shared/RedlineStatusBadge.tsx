import { DrawingBadgeBase } from './DrawingBadgeBase';

export function RedlineStatusBadge({ value }: { value?: string | null }) {
  const tone = ['Open', 'Under Review'].includes(String(value)) ? 'warn' : ['Rejected', 'Overdue'].includes(String(value)) ? 'danger' : ['Closed', 'Incorporated'].includes(String(value)) ? 'good' : 'neutral';
  return <DrawingBadgeBase tone={tone}>{value ?? 'None'}</DrawingBadgeBase>;
}
