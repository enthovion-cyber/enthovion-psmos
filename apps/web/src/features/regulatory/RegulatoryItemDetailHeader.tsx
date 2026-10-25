'use client';

import { useState } from 'react';
import { Archive, Lock, RefreshCw, RotateCcw, Unlock, Zap } from 'lucide-react';
import { RegulatoryButton, RegulatoryCard, formatRegulatoryError } from './shared/RegulatoryUi';
import { RegulatoryStatusBadge } from './shared/RegulatoryStatusBadge';
import { RegulatoryApplicabilityBadge } from './shared/RegulatoryApplicabilityBadge';
import { RegulatoryComplianceStatusBadge } from './shared/RegulatoryComplianceStatusBadge';
import { RegulatoryCriticalityBadge } from './shared/RegulatoryCriticalityBadge';
import type { RegulatoryItem } from './types/regulatory.types';
import { useRegulatoryItemMutations } from './hooks/useRegulatoryItemMutations';
import { SpawnAuditChecklistModal } from './audit-mapping/dialogs/SpawnAuditChecklistModal';

export function RegulatoryItemDetailHeader({ item, onRefresh }: { item: RegulatoryItem; onRefresh: () => void }) {
  const mutations = useRegulatoryItemMutations(item.id);
  const [spawnModalOpen, setSpawnModalOpen] = useState(false);
  const readOnlyReason = item.readOnlyReason ?? (item.locked ? 'Item is locked.' : undefined);
  const busy = mutations.archive.isPending || mutations.reactivate.isPending || mutations.lock.isPending || mutations.unlock.isPending;

  async function run(action: 'archive' | 'reactivate' | 'lock' | 'unlock') {
    const reason = window.prompt(`Reason required to ${action} this regulatory item`);
    if (!reason?.trim()) return;
    try {
      await mutations[action].mutateAsync({ reason });
      onRefresh();
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }

  return (
    <RegulatoryCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Regulatory Requirement</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{item.requirement_code ?? 'Draft'} - {item.requirement_title ?? 'Untitled requirement'}</h1>
          <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{item.short_summary ?? 'No summary has been entered.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <RegulatoryStatusBadge status={item.register_status} />
            <RegulatoryApplicabilityBadge status={item.applicability_status} />
            <RegulatoryComplianceStatusBadge status={item.compliance_status} />
            <RegulatoryCriticalityBadge criticality={item.criticality} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSpawnModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500/20 dark:border-teal-400/30 dark:bg-teal-500/20 dark:text-teal-300 dark:hover:bg-teal-500/30 transition-colors"
            title="Auto-spawn OSHA/EPA audit checklist protocol into Module 4.4"
          >
            <Zap size={14} className="text-teal-600 dark:text-teal-400" />
            <span>Spawn Audit Checklist</span>
          </button>
          <RegulatoryButton variant="secondary" onClick={onRefresh}><RefreshCw size={16} />Refresh</RegulatoryButton>
          <RegulatoryButton variant="secondary" href={`/regulatory/${item.id}/edit`} disabled={!!item.readOnly} title={readOnlyReason ?? 'Edit item'}>Edit</RegulatoryButton>
          {item.locked ? (
            <RegulatoryButton variant="secondary" disabled={busy} title={busy ? 'Saving lock status.' : 'Unlock requires permission and reason.'} onClick={() => void run('unlock')}><Unlock size={16} />Unlock</RegulatoryButton>
          ) : (
            <RegulatoryButton variant="secondary" disabled={busy} title={busy ? 'Saving lock status.' : 'Lock requires permission and reason.'} onClick={() => void run('lock')}><Lock size={16} />Lock</RegulatoryButton>
          )}
          {item.register_status === 'Archived' ? (
            <RegulatoryButton variant="secondary" disabled={busy} onClick={() => void run('reactivate')}><RotateCcw size={16} />Reactivate</RegulatoryButton>
          ) : (
            <RegulatoryButton variant="danger" disabled={busy || !!item.readOnly} title={item.readOnly ? readOnlyReason : 'Archive requires permission and reason.'} onClick={() => void run('archive')}><Archive size={16} />Archive</RegulatoryButton>
          )}
        </div>
      </div>
      <SpawnAuditChecklistModal
        isOpen={spawnModalOpen}
        onClose={() => setSpawnModalOpen(false)}
        onSuccess={onRefresh}
        sourceType="regulation"
        sourceId={item.id}
        sourceCode={item.requirement_code}
        sourceTitle={item.requirement_title}
      />
    </RegulatoryCard>
  );
}
