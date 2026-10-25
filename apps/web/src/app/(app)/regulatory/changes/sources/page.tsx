'use client';
import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '@/features/regulatory/RegulatoryHeader';
import { RegulatoryLayout } from '@/features/regulatory/layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '@/features/regulatory/shared/RegulatoryUi';
import { regulatoryChangeService } from '@/features/regulatory/changes/service';
export default function RegulatoryChangeSourcesPage() { const query = useQuery({ queryKey: ['regulatory', 'changes', 'sources'], queryFn: () => regulatoryChangeService.sources() }); return <RegulatoryLayout current="Change Management"><div className="space-y-5"><RegulatoryHeader title="Regulatory Change Sources" subtitle="Monitoring foundation for approved sources. Source checks are recorded manually." action={<RegulatoryButton href="/regulatory/changes/sources/new">Add source</RegulatoryButton>} />{query.isLoading ? <RegulatoryLoadingState rows={5} /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => void query.refetch()} /> : <RegulatoryCard title="Sources"><pre className="max-h-[600px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></RegulatoryCard>}</div></RegulatoryLayout>; }
