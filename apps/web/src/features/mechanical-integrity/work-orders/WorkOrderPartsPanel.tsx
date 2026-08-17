'use client';

import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { PartsStatusBadge } from '../shared/PartsStatusBadge';

export function WorkOrderPartsPanel({ parts = [] }: { parts?: Array<Record<string, unknown>> | undefined }) {
  return <SectionCard title="Parts / Resources" description="Spare parts, material status, purchase references, and resource constraints.">{!parts.length ? <p className="text-sm text-[var(--psm-muted)]">No parts recorded.</p> : <div className="space-y-2">{parts.map((part) => <div key={String(part.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{cardValue(part.part_name)}</p><PartsStatusBadge status={String(part.status ?? '')} /></div><p className="text-[var(--psm-muted)]">Required: {cardValue(part.quantity_required)} {cardValue(part.unit, '')} · Used: {cardValue(part.quantity_used, '0')}</p></div>)}</div>}</SectionCard>;
}
