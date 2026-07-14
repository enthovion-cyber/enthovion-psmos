import Link from 'next/link';
import { GitBranch, RefreshCcw } from 'lucide-react';
import { FieldGrid, LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaLinkedHazopSnapshot({ snapshot, canSync, onSync, isSyncing }: { snapshot: any | null; canSync?: boolean | undefined; onSync?: (() => void) | undefined; isSyncing?: boolean | undefined }) {
  if (!snapshot) {
    return (
      <LopaPanel title="Linked HAZOP Scenario Snapshot">
        <div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-4 text-sm text-slate-400">This LOPA study is manual or has no accessible HAZOP source snapshot.</div>
      </LopaPanel>
    );
  }
  return (
    <LopaPanel
      title="Linked HAZOP Scenario Snapshot"
      action={canSync ? <button onClick={onSync} disabled={isSyncing} className="lopa-button-secondary"><RefreshCcw size={14} /> {isSyncing ? 'Syncing' : 'Sync from HAZOP'}</button> : null}
    >
      {snapshot.sourceChanged ? <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">Source HAZOP changed after this LOPA snapshot. Review before using refreshed values.</div> : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TonePill tone="info"><GitBranch size={12} /> {snapshot.hazopNumber}</TonePill>
        <TonePill tone={snapshot.traceabilityStatus === 'Linked' ? 'success' : 'warning'}>{snapshot.traceabilityStatus}</TonePill>
        {snapshot.riskLevel ? <TonePill tone={['High', 'Critical'].includes(snapshot.riskLevel) ? 'danger' : 'warning'}>{snapshot.riskLevel}</TonePill> : null}
      </div>
      <FieldGrid items={[
        ['HAZOP title', snapshot.hazopTitle],
        ['Node', snapshot.node],
        ['Deviation', snapshot.deviation],
        ['Cause', snapshot.cause],
        ['Consequence', snapshot.consequence],
        ['Initial / residual risk', [snapshot.initialRisk, snapshot.residualRisk].filter(Boolean).join(' / ') || '-'],
        ['LOPA required reason', snapshot.lopaRequiredReason],
        ['Recommendation reference', snapshot.recommendationReference],
        ['Safeguards count', snapshot.safeguardsCount],
        ['Equipment tag', snapshot.equipmentTag],
        ['Linked MOC / PSSR', [snapshot.linkedMoc, snapshot.linkedPssr].filter(Boolean).join(' / ') || '-'],
        ['Scenario status', snapshot.scenarioStatus]
      ]} />
      {snapshot.hazopId ? <Link href={`/hazop/${snapshot.hazopId}`} className="mt-4 inline-flex text-xs font-bold text-blue-300">Open HAZOP study</Link> : null}
    </LopaPanel>
  );
}
