import { TonePill } from '../overview/LopaOverviewShared';

export function RiskGapBadge({ value, meets }: { value?: number | string | null; meets?: boolean | null }) {
  const numeric = Number(value);
  if (meets) return <TonePill tone="success">Criteria met</TonePill>;
  if (!Number.isFinite(numeric) || numeric <= 0) return <TonePill tone="neutral">Not evaluated</TonePill>;
  return <TonePill tone={numeric > 1 ? 'danger' : 'success'}>{numeric.toFixed(2)}x gap</TonePill>;
}
