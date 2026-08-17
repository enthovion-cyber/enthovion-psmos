import { SafeguardBadge } from './safeguard-badge-utils';
export function DegradedSafeguardBadge({ degraded }: { degraded?: boolean | string | null | undefined }) { return <SafeguardBadge value={typeof degraded === 'boolean' ? (degraded ? 'Degraded' : 'Healthy') : degraded} fallback="Healthy" />; }
