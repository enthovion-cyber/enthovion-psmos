'use client';
import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '@/features/regulatory/RegulatoryHeader';
import { RegulatoryLayout } from '@/features/regulatory/layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '@/features/regulatory/shared/RegulatoryUi';
import { regulatoryChangeService } from '@/features/regulatory/changes/service';
export default function RegulatoryImpactAssessmentsPage() { const query = useQuery({ queryKey: ['regulatory', 'changes', 'impacts'], queryFn: regulatoryChangeService.impacts }); return <RegulatoryLayout current="Change Management"><div className="space-y-5"><RegulatoryHeader title="Change Impact Assessments" subtitle="Backend-controlled impact workflow across applicability, obligations, compliance, evidence, audit mapping, actions, reviews, and reports." />{query.isLoading ? <RegulatoryLoadingState rows={6} /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => void query.refetch()} /> : <RegulatoryCard title="Impact assessments"><pre className="max-h-[600px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></RegulatoryCard>}</div></RegulatoryLayout>; }
