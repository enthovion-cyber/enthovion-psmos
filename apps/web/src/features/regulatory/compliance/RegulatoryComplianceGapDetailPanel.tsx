import type { RegulatoryComplianceGap } from '../types/regulatory-compliance.types';
import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryComplianceGapSeverityBadge } from '../shared/RegulatoryComplianceGapSeverityBadge';
import { RegulatoryComplianceGapStatusBadge } from '../shared/RegulatoryComplianceGapStatusBadge';

export function RegulatoryComplianceGapDetailPanel({ gap }: { gap?: RegulatoryComplianceGap | null }) {
  if (!gap) return <RegulatoryCard title="Compliance Gap Detail"><p className="text-sm text-[var(--psm-muted)]">Select a compliance gap to view detail.</p></RegulatoryCard>;
  const rows = [
    ['Gap number', gap.gap_number],
    ['Gap type', gap.gap_type],
    ['Impact type', gap.impact_type],
    ['Owner', gap.owner_user_id],
    ['Due date', gap.due_date],
    ['Recommended fix', gap.recommended_fix],
    ['Evidence required', gap.evidence_required ? 'Yes' : 'No'],
    ['Action required', gap.action_required ? 'Yes' : 'No'],
    ['CAPA required', gap.capa_required ? 'Yes' : 'No'],
    ['Resolution note', gap.resolution_note]
  ];
  return (
    <RegulatoryCard title={gap.gap_title ?? 'Compliance Gap Detail'} subtitle={gap.gap_description ?? 'No gap description returned by backend.'}>
      <div className="mb-4 flex flex-wrap gap-2"><RegulatoryComplianceGapStatusBadge status={gap.gap_status} /><RegulatoryComplianceGapSeverityBadge severity={gap.severity} /></div>
      <dl className="grid gap-3 md:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[var(--psm-fg)]">{value ? String(value) : 'Not recorded'}</dd></div>)}</dl>
    </RegulatoryCard>
  );
}
