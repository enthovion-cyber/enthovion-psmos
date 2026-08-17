import { TrainingBadge } from './TrainingUi';

export function LibraryLinkMissingBadge({ missing }: { missing?: boolean | null }) {
  return missing ? <TrainingBadge tone="danger">Library link missing</TrainingBadge> : <TrainingBadge tone="good">Library linked</TrainingBadge>;
}
