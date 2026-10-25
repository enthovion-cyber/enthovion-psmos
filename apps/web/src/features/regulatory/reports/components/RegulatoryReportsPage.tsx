'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../../RegulatoryHeader';
import { RegulatoryLayout } from '../../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryReports } from '../hooks/useRegulatoryReports';
import { RegulatoryReportRegister } from './RegulatoryReportRegister';
import { RegulatoryReportSummaryCards } from './RegulatoryReportSummaryCards';

export function RegulatoryReportsPage({ initialView = '' }: { initialView?: string }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState(initialView);
  const query = useRegulatoryReports({ search: search || undefined, view: view || undefined });
  return <RegulatoryLayout current="Reports & Export"><div className="space-y-5"><RegulatoryHeader title="Regulatory Reports & Export" subtitle="Controlled reporting with source snapshots, permissions, evidence rules, versions, access logs, and export jobs." onRefresh={() => void query.refetch()} action={<RegulatoryButton href="/regulatory/reports/generate">Generate report</RegulatoryButton>} /><RegulatoryCard title="Filters / Search"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><RegulatoryField label="Search"><input className={regulatoryInputClass()} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code, title, or report type" /></RegulatoryField><RegulatoryField label="View"><select className={regulatoryInputClass()} value={view} onChange={(event) => setView(event.target.value)}><option value="">All reports</option><option value="draft">Draft</option><option value="generated">Generated</option><option value="pending-approval">Pending approval</option><option value="stale">Stale</option><option value="failed">Failed</option><option value="archived">Archived</option></select></RegulatoryField></div></RegulatoryCard>{query.isLoading ? <RegulatoryLoadingState rows={8} /> : query.isError ? <RegulatoryErrorState message={query.error instanceof Error ? query.error.message : 'Unable to load regulatory reports.'} onRetry={() => void query.refetch()} /> : <><RegulatoryReportSummaryCards summary={query.data?.summary} /><RegulatoryCard title="Report register" subtitle={`${query.data?.total ?? 0} records within your company/site scope.`}><RegulatoryReportRegister rows={query.data?.rows} /></RegulatoryCard></>}</div></RegulatoryLayout>;
}
