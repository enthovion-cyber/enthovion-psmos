import { UsageProgressCard } from './UsageProgressCard';
import type { UsageLimitCard as UsageLimit } from './types/usage.types';

export function StorageUsageCard({ card }: { card?: UsageLimit }) {
  return card ? <UsageProgressCard card={card} /> : <div className="psm-panel rounded-xl p-4 text-sm text-[var(--psm-muted)]">Storage usage not configured.</div>;
}
