import { DrawingBadgeBase } from './DrawingBadgeBase';

export function CurrentApprovedBadge({ value }: { value?: boolean | null }) {
  return <DrawingBadgeBase tone={value ? 'good' : 'danger'}>{value ? 'Current approved' : 'Not current'}</DrawingBadgeBase>;
}
