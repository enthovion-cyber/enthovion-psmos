import { DrawingBadgeBase } from './DrawingBadgeBase';

export function DocumentStatusBadge({ value }: { value?: string | null }) {
  const tone = ['Approved', 'Current', 'As-Built Verified'].includes(String(value)) ? 'good' : ['Superseded', 'Expired', 'Rejected', 'Archived'].includes(String(value)) ? 'danger' : value ? 'warn' : 'danger';
  return <DrawingBadgeBase tone={tone}>{value ?? 'No document'}</DrawingBadgeBase>;
}
