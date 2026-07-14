'use client';

import { useBillingOverview } from './hooks/useBillingOverview';
import { useBillingMutations } from './hooks/useBillingMutations';
import { SeatUsageCard } from './SeatUsageCard';
import { SiteUsageCard } from './SiteUsageCard';
import { StorageUsageCard } from './StorageUsageCard';
import { UsageProgressCard } from './UsageProgressCard';

export function UsageDashboard() {
  const overview = useBillingOverview();
  const mutations = useBillingMutations();
  if (overview.isLoading) return <div className="psm-panel rounded-xl p-6">Loading usage...</div>;
  if (!overview.data) return <div className="psm-panel rounded-xl p-6 text-sm text-[var(--psm-muted)]">Usage is unavailable.</div>;
  const cards = overview.data.limitCards;
  const seatCard = cards.find((card) => card.key === 'limit.seats');
  const siteCard = cards.find((card) => card.key === 'limit.sites');
  const storageCard = cards.find((card) => card.key === 'limit.storage');
  return <div className="space-y-4"><div className="flex justify-end"><button className="psm-button" onClick={() => void mutations.recalculateUsage.mutateAsync()}>Recalculate usage</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SeatUsageCard {...(seatCard ? { card: seatCard } : {})} /><SiteUsageCard {...(siteCard ? { card: siteCard } : {})} /><StorageUsageCard {...(storageCard ? { card: storageCard } : {})} />{cards.filter((card) => !['limit.seats','limit.sites','limit.storage'].includes(card.key)).map((card) => <UsageProgressCard key={card.key} card={card} />)}</div></div>;
}
