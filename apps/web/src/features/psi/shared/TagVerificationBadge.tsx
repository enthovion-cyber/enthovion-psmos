import { DrawingBadgeBase } from './DrawingBadgeBase';

export function TagVerificationBadge({ value }: { value?: string | null }) {
  const tone = value === 'Verified' ? 'good' : ['Mismatch', 'Missing In Source Module', 'Missing On Drawing'].includes(String(value)) ? 'danger' : value === 'Needs Review' ? 'warn' : 'neutral';
  return <DrawingBadgeBase tone={tone}>{value ?? 'Unverified'}</DrawingBadgeBase>;
}
