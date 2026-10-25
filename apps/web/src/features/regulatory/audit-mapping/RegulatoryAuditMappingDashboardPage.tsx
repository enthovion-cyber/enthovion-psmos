'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappingDashboard } from '../hooks/useRegulatoryAuditMappingDashboard';
import { AuditMappingMiniList } from './AuditMappingUi';
import { RegulatoryAuditMappingSummaryCards } from './RegulatoryAuditMappingSummaryCards';
import { SpawnAuditChecklistModal } from './dialogs/SpawnAuditChecklistModal';

export function RegulatoryAuditMappingDashboardPage() {
  const query = useRegulatoryAuditMappingDashboard({});
  const [spawnModalOpen, setSpawnModalOpen] = useState(false);
  if (query.isLoading) return <RegulatoryLayout current="Audit Mapping"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Mapping"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const empty = !Number(data?.summary?.totalMappings ?? 0);
  const targetMapping = (data?.recent ?? data?.rows)?.[0];

  return (
    <RegulatoryLayout current="Audit Mapping">
      <div className="space-y-5">
        <RegulatoryHeader
          title="Audit Mapping"
          subtitle={data?.header?.subtitle ?? 'Map regulatory obligations to audit programs, plans, checklists, evidence, findings, CAPA, and scoring.'}
          onRefresh={() => query.refetch()}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSpawnModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500/20 dark:border-teal-400/30 dark:bg-teal-500/20 dark:text-teal-300 dark:hover:bg-teal-500/30 transition-colors"
                title="Spawn audit checklist protocol into Module 4.4"
              >
                <Zap size={14} className="text-teal-600 dark:text-teal-400" />
                <span>Spawn Checklist</span>
              </button>
              <RegulatoryButton href="/regulatory/audit-mapping/new">New Mapping</RegulatoryButton>
            </div>
          }
        />
        {empty ? <RegulatoryEmptyState title="No audit mappings" message="No regulatory audit mapping exists in the selected company/site scope. Create a mapping or run backend gap detection." action={<RegulatoryButton href="/regulatory/audit-mapping/new">Create Mapping</RegulatoryButton>} /> : null}
        <RegulatoryAuditMappingSummaryCards summary={data?.summary} />
        <div className="grid gap-5 xl:grid-cols-2">
          <RegulatoryCard title="Recent Audit Mappings" action={<RegulatoryButton href="/regulatory/audit-mapping/register" variant="secondary">Open Register</RegulatoryButton>}><AuditMappingMiniList rows={data?.recent ?? data?.rows} /></RegulatoryCard>
          <RegulatoryCard title="Open Mapping Gaps" action={<RegulatoryButton href="/regulatory/audit-mapping/gaps" variant="secondary">Open Gaps</RegulatoryButton>}><AuditMappingMiniList rows={data?.gaps?.rows as any} empty="No backend-generated open audit mapping gaps." /></RegulatoryCard>
          <Breakdown title="Coverage Breakdown" rows={data?.byCoverage?.rows ?? data?.summary?.byCoverage} />
          <Breakdown title="Verification Breakdown" rows={data?.byVerification?.rows ?? data?.summary?.byVerification} />
        </div>
      </div>
      {targetMapping && (
        <SpawnAuditChecklistModal
          isOpen={spawnModalOpen}
          onClose={() => setSpawnModalOpen(false)}
          onSuccess={() => { void query.refetch(); }}
          sourceType="mapping"
          sourceId={targetMapping.id}
          sourceCode={targetMapping.mapping_code}
          sourceTitle={targetMapping.mapping_title}
        />
      )}
    </RegulatoryLayout>
  );
}

function Breakdown({ title, rows }: { title: string; rows?: any }) {
  const normalized = Array.isArray(rows) ? rows : Object.entries(rows ?? {}).map(([label, count]) => ({ label, count }));
  return <RegulatoryCard title={title}>{normalized.length ? <div className="space-y-2">{normalized.map((row: any) => <div key={row.label} className="flex justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span>{row.label}</span><b>{row.count}</b></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend data for this breakdown.</p>}</RegulatoryCard>;
}
