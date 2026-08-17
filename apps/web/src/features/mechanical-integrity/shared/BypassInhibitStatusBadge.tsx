import { SafeguardBadge } from './safeguard-badge-utils';
export function BypassInhibitStatusBadge({ active }: { active?: boolean | string | null | undefined }) { return <SafeguardBadge value={typeof active === 'boolean' ? (active ? 'Active bypass' : 'No bypass') : active} fallback="No bypass" />; }
