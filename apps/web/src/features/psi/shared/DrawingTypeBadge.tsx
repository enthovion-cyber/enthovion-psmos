import { DrawingBadgeBase } from './DrawingBadgeBase';

export function DrawingTypeBadge({ value }: { value?: string | null }) {
  return <DrawingBadgeBase tone={value === 'P&ID' || value === 'PFD' ? 'info' : 'neutral'}>{value ?? 'Unknown'}</DrawingBadgeBase>;
}
