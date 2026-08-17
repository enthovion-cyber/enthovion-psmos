import { DrawingBadgeBase } from './DrawingBadgeBase';

export function DrawingStatusBadge({ value }: { value?: string | null }) {
  const tone = ['Approved', 'Current', 'As-Built Verified'].includes(String(value)) ? 'good' : ['Superseded', 'Expired', 'Rejected', 'Archived'].includes(String(value)) ? 'danger' : ['Pending Review', 'Redline', 'As-Built Pending'].includes(String(value)) ? 'warn' : 'neutral';
  return <DrawingBadgeBase tone={tone}>{value ?? 'Not set'}</DrawingBadgeBase>;
}
