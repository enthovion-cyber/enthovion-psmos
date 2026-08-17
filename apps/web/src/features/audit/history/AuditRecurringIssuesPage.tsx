'use client';

import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { useAuditRecurringIssues } from '../hooks/useAuditRecurringIssues';
import { AuditCard, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditRecurringIssueTable } from './AuditRecurringIssueTable';

export function AuditRecurringIssuesPage() {
  const query = useAuditRecurringIssues();
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Recurring Issues" subtitle="Backend-created recurring/systemic clusters with linked findings, affected scopes, CAPA links, and CI foundation." /><AuditCard title={`${query.data?.total ?? 0} recurring issue clusters`}><AuditRecurringIssueTable rows={query.data?.rows ?? []} /></AuditCard></div></AuditLayout>;
}
