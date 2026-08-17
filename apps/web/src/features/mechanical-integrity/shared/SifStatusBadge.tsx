import { SafeguardBadge } from './safeguard-badge-utils';
export function SifStatusBadge({ status }: { status?: string | null | undefined }) { return <SafeguardBadge value={status} fallback="Unknown" />; }
