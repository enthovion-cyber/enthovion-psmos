'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryApplicabilityGaps } from '../hooks/useRegulatoryApplicabilityGaps';
import { RegulatoryApplicabilityGapTable } from './RegulatoryApplicabilityGapTable';
export function RegulatoryApplicabilityGapPage() { const query = useRegulatoryApplicabilityGaps(); return <RegulatoryLayout current="Applicability Gaps"><div className="space-y-5"><RegulatoryHeader title="Applicability Gaps" subtitle="Backend-generated missing assessment, rationale, scope, review, evidence foundation and stale-applicability gaps." />{query.isLoading ? <RegulatoryLoadingState /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /> : <RegulatoryApplicabilityGapTable rows={query.data?.rows} />}</div></RegulatoryLayout>; }
