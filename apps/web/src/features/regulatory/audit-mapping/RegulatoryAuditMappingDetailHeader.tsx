import { RegulatoryButton } from '../shared/RegulatoryUi';
import { AuditMappingStatusStrip, valueText } from './AuditMappingUi';
import type { RegulatoryAuditMappingRow } from '../types/regulatory-audit-mapping.types';

export function RegulatoryAuditMappingDetailHeader({ mapping, onRefresh }: { mapping?: RegulatoryAuditMappingRow | undefined; onRefresh?: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">Regulatory Audit Mapping</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{valueText(mapping?.mapping_code)} - {valueText(mapping?.mapping_title, 'Untitled mapping')}</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{valueText(mapping?.regulatory_source_type)} to {valueText(mapping?.audit_target_type)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton>
          <RegulatoryButton href="/regulatory/audit-mapping/new">New Mapping</RegulatoryButton>
        </div>
      </div>
      <div className="mt-4"><AuditMappingStatusStrip row={mapping} /></div>
      {mapping?.restricted ? <p className="mt-3 text-sm font-semibold text-danger">{mapping.restrictedReason}</p> : null}
    </div>
  );
}
