import { SafeguardBadge } from './safeguard-badge-utils';
export function SilBadge({ sil }: { sil?: string | null | undefined }) { return <SafeguardBadge value={sil} fallback="SIL not set" />; }
