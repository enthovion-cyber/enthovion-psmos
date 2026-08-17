'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappingDashboard } from '../hooks/useRegulatoryAuditMappingDashboard';
import { AuditMappingMiniList } from './AuditMappingUi';
import { RegulatoryAuditMappingSummaryCards } from './RegulatoryAuditMappingSummaryCards';

export function RegulatoryAuditMappingDashboardPage() {
  const query = useRegulatoryAuditMappingDashboard({});
  if (query.isLoading) return <RegulatoryLayout current="Audit Mapping"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Mapping"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const empty = !Number(data?.summary?.totalMappings ?? 0);
  return (
    <RegulatoryLayout current="Audit Mapping">
      <div className="space-y-5">
        <RegulatoryHeader title="Audit Mapping" subtitle={data?.header?.subtitle ?? 'Map regulatory obligations to audit programs, plans, checklists, evidence, findings, CAPA, and scoring.'} onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/audit-mapping/new">New Mapping</RegulatoryButton>} />
        {empty ? <RegulatoryEmptyState title="No audit mappings" message="No regulatory audit mapping exists in the selected company/site scope. Create a mapping or run backend gap detection." action={<RegulatoryButton href="/regulatory/audit-mapping/new">Create Mapping</RegulatoryButton>} /> : null}
        <RegulatoryAuditMappingSummaryCards summary={data?.summary} />
        <div className="grid gap-5 xl:grid-cols-2">
          <RegulatoryCard title="Recent Audit Mappings" action={<RegulatoryButton href="/regulatory/audit-mapping/register" variant="secondary">Open Register</RegulatoryButton>}><AuditMappingMiniList rows={data?.recent ?? data?.rows} /></RegulatoryCard>
          <RegulatoryCard title="Open Mapping Gaps" action={<RegulatoryButton href="/regulatory/audit-mapping/gaps" variant="secondary">Open Gaps</RegulatoryButton>}><AuditMappingMiniList rows={data?.gaps?.rows as any} empty="No backend-generated open audit mapping gaps." /></RegulatoryCard>
          <Breakdown title="Coverage Breakdown" rows={data?.byCoverage?.rows ?? data?.summary?.byCoverage} />
          <Breakdown title="Verification Breakdown" rows={data?.byVerification?.rows ?? data?.summary?.byVerification} />
        </div>
      </div>
    </RegulatoryLayout>
  );
}

function Breakdown({ title, rows }: { title: string; rows?: any }) {
  const normalized = Array.isArray(rows) ? rows : Object.entries(rows ?? {}).map(([label, count]) => ({ label, count }));
  return <RegulatoryCard title={title}>{normalized.length ? <div className="space-y-2">{normalized.map((row: any) => <div key={row.label} className="flex justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span>{row.label}</span><b>{row.count}</b></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend data for this breakdown.</p>}</RegulatoryCard>;
}
