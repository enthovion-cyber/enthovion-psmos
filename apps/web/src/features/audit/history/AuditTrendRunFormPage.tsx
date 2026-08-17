'use client';

import { useRouter } from 'next/navigation';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { useAuditTrendLookups } from '../hooks/useAuditTrendLookups';
import { useAuditTrendMutations } from '../hooks/useAuditTrendMutations';
import { AuditCard, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditTrendRunForm } from './AuditTrendRunForm';

export function AuditTrendRunFormPage() {
  const router = useRouter();
  const lookups = useAuditTrendLookups();
  const mutations = useAuditTrendMutations();
  if (lookups.isLoading) return <AuditLayout><AuditLoadingState rows={5} /></AuditLayout>;
  if (lookups.isError) return <AuditLayout><AuditErrorState message={lookups.error} onRetry={() => lookups.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Run Audit Trend Analysis" subtitle="Backend calculates trends from accessible real audit records and stores immutable snapshots, trace, results, and source records." actionHref="/audit-compliance/history/trends/runs" /><AuditCard title="Trend run inputs"><AuditTrendRunForm lookups={lookups.data} saving={mutations.create.isPending} onSubmit={(payload) => mutations.create.mutate(payload, { onSuccess: (detail) => router.push(`/audit-compliance/history/trends/runs/${detail.trendRun.id}`) })} /></AuditCard>{mutations.create.isError ? <AuditErrorState message={mutations.create.error} /> : null}</div></AuditLayout>;
}
