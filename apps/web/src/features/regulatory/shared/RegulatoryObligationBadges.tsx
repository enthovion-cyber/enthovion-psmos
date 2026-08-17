import { RegulatoryBadge } from './RegulatoryUi';

function toneFor(value?: string | null) {
  if (!value) return 'neutral' as const;
  if (['Active', 'Applicable', 'Compliant Foundation', 'Current', 'Mapped To Module', 'Evidence Required', 'Evidence Linked Foundation', 'Ready Foundation'].includes(value)) return 'good' as const;
  if (['Draft', 'Not Assessed', 'Inherited From Parent', 'No Due Date', 'Not Mapped'].includes(value)) return 'neutral' as const;
  if (['Due Soon', 'Under Review', 'Partially Applicable', 'Review Required', 'Mapping Required', 'Evidence Expectation Missing', 'Stale Applicability'].includes(value)) return 'warn' as const;
  if (['Overdue', 'Non-Compliant Foundation', 'Archived', 'Superseded', 'Cancelled', 'Action Required', 'CAPA Open', 'Reassessment Required'].includes(value)) return 'danger' as const;
  if (value.includes('Critical')) return 'danger' as const;
  if (value.includes('Missing') || value.includes('Overdue') || value.includes('Stale')) return 'warn' as const;
  return 'info' as const;
}

export function RegulatoryObligationStatusBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Not Set'}</RegulatoryBadge>;
}

export function RegulatoryObligationTypeBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Type Not Set'}</RegulatoryBadge>;
}

export function RegulatoryObligationFrequencyBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Frequency Missing'}</RegulatoryBadge>;
}

export function RegulatoryObligationDueStatusBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'No Due Date'}</RegulatoryBadge>;
}

export function RegulatoryObligationApplicabilityBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Not Assessed'}</RegulatoryBadge>;
}

export function RegulatoryObligationEvidenceBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Evidence Expectation Missing'}</RegulatoryBadge>;
}

export const RegulatoryEvidenceExpectationStatusBadge = RegulatoryObligationEvidenceBadge;

export function RegulatoryObligationMappingBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Not Mapped'}</RegulatoryBadge>;
}

export const RegulatoryModuleMappingStatusBadge = RegulatoryObligationMappingBadge;

export function RegulatoryObligationStaleBadge({ value, reason }: { value?: string | null | undefined; reason?: string | null | undefined }) {
  return <span title={reason ?? undefined}><RegulatoryBadge tone={toneFor(value)}>{value ?? 'Current'}</RegulatoryBadge></span>;
}

export function RegulatoryObligationGapBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={toneFor(value)}>{value ?? 'Open Gap'}</RegulatoryBadge>;
}
