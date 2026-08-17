import { ReactionHazardBadge } from './ReactionHazardBadge';

export function RunawayPotentialBadge({ value }: { value?: string | null | undefined }) {
  return <ReactionHazardBadge value={value ?? 'Unknown / Needs Study'} />;
}
