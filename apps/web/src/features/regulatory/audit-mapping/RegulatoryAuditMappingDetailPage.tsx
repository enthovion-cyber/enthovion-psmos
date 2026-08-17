'use client';

import Link from 'next/link';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappingDetail } from '../hooks/useRegulatoryAuditMappingDetail';
import { RegulatoryAuditMappingDetailHeader } from './RegulatoryAuditMappingDetailHeader';
import { AuditMappingAuditLinksTab } from './tabs/AuditMappingAuditLinksTab';
import { AuditMappingCapaTab } from './tabs/AuditMappingCapaTab';
import { AuditMappingCoverageTab } from './tabs/AuditMappingCoverageTab';
import { AuditMappingEvidenceTab } from './tabs/AuditMappingEvidenceTab';
import { AuditMappingFindingsTab } from './tabs/AuditMappingFindingsTab';
import { AuditMappingHistoryTab } from './tabs/AuditMappingHistoryTab';
import { AuditMappingOverviewTab } from './tabs/AuditMappingOverviewTab';
import { AuditMappingReportsTab } from './tabs/AuditMappingReportsTab';
import { AuditMappingReviewTab } from './tabs/AuditMappingReviewTab';
import { AuditMappingScoringTab } from './tabs/AuditMappingScoringTab';
import { AuditMappingSourceTab } from './tabs/AuditMappingSourceTab';
import { AuditMappingTraceabilityTab } from './tabs/AuditMappingTraceabilityTab';
import type { RegulatoryAuditMappingDetail } from '../types/regulatory-audit-mapping.types';

const tabs = ['overview', 'source', 'audit-links', 'coverage', 'traceability', 'evidence', 'findings', 'capa', 'scoring', 'review', 'reports', 'history'];

export function RegulatoryAuditMappingDetailPage({ mappingId, tab = 'overview' }: { mappingId: string; tab?: string }) {
  const query = useRegulatoryAuditMappingDetail(mappingId);
  if (query.isLoading) return <RegulatoryLayout current="Audit Mapping"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Mapping"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const detail = query.data as RegulatoryAuditMappingDetail | undefined;
  return (
    <RegulatoryLayout current="Audit Mapping">
      <div className="space-y-5">
        <RegulatoryAuditMappingDetailHeader mapping={detail?.mapping} onRefresh={() => query.refetch()} />
        <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
          {tabs.map((item) => <Link key={item} href={`/regulatory/audit-mapping/${mappingId}/${item === 'overview' ? '' : item}`.replace(/\/$/, '')} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{item.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')}</Link>)}
        </nav>
        {renderTab(tab, detail)}
      </div>
    </RegulatoryLayout>
  );
}

function renderTab(tab: string, detail: RegulatoryAuditMappingDetail | undefined) {
  if (tab === 'source') return <AuditMappingSourceTab detail={detail} />;
  if (tab === 'audit-links') return <AuditMappingAuditLinksTab detail={detail} />;
  if (tab === 'coverage') return <AuditMappingCoverageTab detail={detail} />;
  if (tab === 'traceability') return <AuditMappingTraceabilityTab detail={detail} />;
  if (tab === 'evidence') return <AuditMappingEvidenceTab detail={detail} />;
  if (tab === 'findings') return <AuditMappingFindingsTab detail={detail} />;
  if (tab === 'capa') return <AuditMappingCapaTab detail={detail} />;
  if (tab === 'scoring') return <AuditMappingScoringTab detail={detail} />;
  if (tab === 'review') return <AuditMappingReviewTab detail={detail} />;
  if (tab === 'reports') return <AuditMappingReportsTab detail={detail} />;
  if (tab === 'history') return <AuditMappingHistoryTab detail={detail} />;
  return <AuditMappingOverviewTab detail={detail} />;
}
