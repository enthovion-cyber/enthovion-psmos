import { DrawingBadgeBase } from './DrawingBadgeBase';

export function AsBuiltStatusBadge({ verified, required }: { verified?: boolean | null; required?: boolean | null }) {
  return <DrawingBadgeBase tone={verified ? 'good' : required ? 'warn' : 'neutral'}>{verified ? 'As-built verified' : required ? 'As-built required' : 'Not required'}</DrawingBadgeBase>;
}
