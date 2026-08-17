import { SafeguardBadge } from './safeguard-badge-utils';
export function InterlockStatusBadge({ status }: { status?: string | null | undefined }) { return <SafeguardBadge value={status} fallback="Unknown" />; }
