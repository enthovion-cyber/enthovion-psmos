import type { UsageLimitCard as UsageLimit } from './types/usage.types';

export function UsageProgressCard({ card }: { card: UsageLimit }) {
  const color = card.exceeded ? 'bg-danger' : card.nearLimit ? 'bg-warning' : 'bg-info';
  return <div className="psm-panel rounded-xl p-4"><div className="flex justify-between gap-3"><div><div className="text-sm font-semibold">{card.key}</div><div className="text-xs text-[var(--psm-muted)]">{card.used} / {card.allowed ?? 'Unlimited'} {card.unit}</div></div>{card.exceeded ? <span className="text-xs text-danger">Blocked</span> : card.nearLimit ? <span className="text-xs text-warning">Near limit</span> : null}</div><div className="mt-4 h-2 rounded-full bg-[var(--psm-line)]"><div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(card.percent, 100)}%` }} /></div></div>;
}
