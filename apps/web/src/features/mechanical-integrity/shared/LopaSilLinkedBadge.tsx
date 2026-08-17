import { SafeguardBadge } from './safeguard-badge-utils';
export function LopaSilLinkedBadge({ linked }: { linked?: boolean | string | null | undefined }) { return <SafeguardBadge value={typeof linked === 'boolean' ? (linked ? 'LOPA/SIL linked' : 'Missing LOPA/SIL') : linked} fallback="Missing LOPA/SIL" />; }
