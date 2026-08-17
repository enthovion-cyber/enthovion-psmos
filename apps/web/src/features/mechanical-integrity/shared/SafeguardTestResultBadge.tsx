import { SafeguardBadge } from './safeguard-badge-utils';
export function SafeguardTestResultBadge({ result }: { result?: string | null | undefined }) { return <SafeguardBadge value={result} fallback="No result" />; }
