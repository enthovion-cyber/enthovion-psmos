import { SafeguardBadge } from './safeguard-badge-utils';
export function CriticalAlarmStatusBadge({ status }: { status?: string | null | undefined }) { return <SafeguardBadge value={status} fallback="Unknown" />; }
