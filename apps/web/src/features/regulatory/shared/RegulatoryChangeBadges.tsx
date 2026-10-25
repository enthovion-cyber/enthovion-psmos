import { RegulatoryBadge } from './RegulatoryUi';

function tone(value: unknown) { const text = String(value ?? 'Not Set'); return /Critical|High|Rejected|Overdue|Stale/.test(text) ? 'danger' as const : /Approved|Implemented|No Impact/.test(text) ? 'good' as const : /Pending|Review|Draft|New/.test(text) ? 'warn' as const : 'info' as const; }
export function RegulatoryChangeStatusBadge({ value }: { value: unknown }) { return <RegulatoryBadge tone={tone(value)}>{String(value ?? 'Not Set')}</RegulatoryBadge>; }
export function RegulatoryChangeImpactStatusBadge({ value }: { value: unknown }) { return <RegulatoryBadge tone={tone(value)}>{String(value ?? 'Not Assessed')}</RegulatoryBadge>; }
export function RegulatoryChangeTypeBadge({ value }: { value: unknown }) { return <RegulatoryBadge tone="info">{String(value ?? 'Not Set')}</RegulatoryBadge>; }
export function RegulatoryChangeSourceTypeBadge({ value }: { value: unknown }) { return <RegulatoryBadge>{String(value ?? 'Not Set')}</RegulatoryBadge>; }
