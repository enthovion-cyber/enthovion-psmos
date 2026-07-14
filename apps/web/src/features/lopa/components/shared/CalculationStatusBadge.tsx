import { TonePill } from '../overview/LopaOverviewShared';

export function CalculationStatusBadge({ value }: { value?: string | null }) {
  const text = value || 'Not Calculated';
  const lower = text.toLowerCase();
  const tone = lower.includes('fail') || lower.includes('blocked') || lower.includes('gap') ? 'danger' : lower.includes('need') || lower.includes('warning') || lower.includes('lock') ? 'warning' : lower.includes('pass') || lower.includes('complete') || lower.includes('calculated') ? 'success' : 'neutral';
  return <TonePill tone={tone}>{text}</TonePill>;
}
