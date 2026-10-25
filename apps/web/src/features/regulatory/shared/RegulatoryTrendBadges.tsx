import { RegulatoryBadge } from './RegulatoryUi';

function tone(value?: string | null): 'good' | 'warn' | 'danger' | 'neutral' { const text = String(value ?? '').toLowerCase(); if (text.includes('improv') || text.includes('ready') || text.includes('confirmed')) return 'good'; if (text.includes('critical') || text.includes('declin') || text.includes('worsen') || text.includes('blocked')) return 'danger'; if (text.includes('stale') || text.includes('pending') || text.includes('warning') || text.includes('insufficient')) return 'warn'; return 'neutral'; }
export function RegulatoryHistoryEventBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Event'}</RegulatoryBadge>; }
export function RegulatoryTrendStatusBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Unknown'}</RegulatoryBadge>; }
export function RegulatoryTrendDirectionBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Insufficient Data'}</RegulatoryBadge>; }
export function RegulatoryTrendConfidenceBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Insufficient Data'}</RegulatoryBadge>; }
export function RegulatoryRepeatGapStatusBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Potential Repeat'}</RegulatoryBadge>; }
export function RegulatoryRecurringIssueStatusBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Open'}</RegulatoryBadge>; }
export function RegulatoryManagementReviewReadinessBadge({ value }: { value?: string | null }) { return <RegulatoryBadge tone={tone(value)}>{value || 'Not Ready'}</RegulatoryBadge>; }
