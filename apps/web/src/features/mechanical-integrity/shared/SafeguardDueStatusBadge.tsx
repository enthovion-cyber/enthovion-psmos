import { SafeguardBadge } from './safeguard-badge-utils';
export function SafeguardDueStatusBadge({ status }: { status?: string | null | undefined }) { return <SafeguardBadge value={status} fallback="Not scheduled" />; }
