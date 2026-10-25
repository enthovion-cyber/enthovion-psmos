import { useState } from 'react';
import { Zap } from 'lucide-react';
import { RegulatoryButton } from '../shared/RegulatoryUi';
import { AuditMappingStatusStrip, valueText } from './AuditMappingUi';
import type { RegulatoryAuditMappingRow } from '../types/regulatory-audit-mapping.types';
import { SpawnAuditChecklistModal } from './dialogs/SpawnAuditChecklistModal';

export function RegulatoryAuditMappingDetailHeader({ mapping, onRefresh }: { mapping?: RegulatoryAuditMappingRow | undefined; onRefresh?: () => void }) {
  const [spawnModalOpen, setSpawnModalOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">Regulatory Audit Mapping</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{valueText(mapping?.mapping_code)} - {valueText(mapping?.mapping_title, 'Untitled mapping')}</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{valueText(mapping?.regulatory_source_type)} to {valueText(mapping?.audit_target_type)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mapping?.id && (
            <button
              type="button"
              onClick={() => setSpawnModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500/20 dark:border-teal-400/30 dark:bg-teal-500/20 dark:text-teal-300 dark:hover:bg-teal-500/30 transition-colors"
              title="Spawn audit checklist protocol for this mapping into Module 4.4"
            >
              <Zap size={14} className="text-teal-600 dark:text-teal-400" />
              <span>Spawn Audit Checklist</span>
            </button>
          )}
          <RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton>
          <RegulatoryButton href="/regulatory/audit-mapping/new">New Mapping</RegulatoryButton>
        </div>
      </div>
      <div className="mt-4"><AuditMappingStatusStrip row={mapping} /></div>
      {mapping?.restricted ? <p className="mt-3 text-sm font-semibold text-danger">{mapping.restrictedReason}</p> : null}
      {mapping?.id && (
        <SpawnAuditChecklistModal
          isOpen={spawnModalOpen}
          onClose={() => setSpawnModalOpen(false)}
          onSuccess={onRefresh}
          sourceType="mapping"
          sourceId={mapping.id}
          sourceCode={mapping.mapping_code}
          sourceTitle={mapping.mapping_title}
        />
      )}
    </div>
  );
}
