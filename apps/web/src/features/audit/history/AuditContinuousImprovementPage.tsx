'use client';

import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { useAuditContinuousImprovement } from '../hooks/useAuditContinuousImprovement';
import { AuditCard, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditImprovementOpportunityForm } from './AuditImprovementOpportunityForm';
import { AuditImprovementOpportunityTable } from './AuditImprovementOpportunityTable';

export function AuditContinuousImprovementPage() {
  const { query, create } = useAuditContinuousImprovement();
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Continuous Improvement Opportunities" subtitle="Action-oriented opportunity foundations from trend results or manual source-backed reasons. These are not final CAPA unless Action Engine creates them." /><AuditCard title={`${query.data?.total ?? 0} opportunities`}><AuditImprovementOpportunityTable rows={query.data?.rows ?? []} /></AuditCard><AuditCard title="Create manual opportunity"><AuditImprovementOpportunityForm saving={create.isPending} onSubmit={(payload) => create.mutate(payload)} /></AuditCard>{create.isError ? <AuditErrorState message={create.error} /> : null}</div></AuditLayout>;
}
