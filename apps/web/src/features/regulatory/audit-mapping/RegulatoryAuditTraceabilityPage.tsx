'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditTraceability } from '../hooks/useRegulatoryAuditTraceability';
import { AuditMappingRecordTable } from './AuditMappingUi';
import { RegulatoryAuditTraceabilityChain } from './RegulatoryAuditTraceabilityChain';

export function RegulatoryAuditTraceabilityPage({ filters }: { filters?: Record<string, unknown> }) {
  const query = useRegulatoryAuditTraceability({ limit: 200, ...(filters ?? {}) });
  if (query.isLoading) return <RegulatoryLayout current="Audit Traceability"><RegulatoryLoadingState rows={7} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Traceability"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Audit Traceability"><div className="space-y-5"><RegulatoryHeader title="Audit Traceability" subtitle="Immutable snapshots from regulation to obligation, audit target, evidence, findings, CAPA, and scoring." onRefresh={() => query.refetch()} /><RegulatoryAuditTraceabilityChain rows={query.data?.rows} /><RegulatoryCard title="Traceability Snapshot Register"><AuditMappingRecordTable rows={query.data?.rows} /></RegulatoryCard></div></RegulatoryLayout>;
}
