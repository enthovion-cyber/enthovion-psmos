'use client';
import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '@/features/regulatory/RegulatoryHeader';
import { RegulatoryLayout } from '@/features/regulatory/layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '@/features/regulatory/shared/RegulatoryUi';
import { regulatoryChangeService } from '@/features/regulatory/changes/service';
export default function RegulatoryChangeWatchlistPage() { const query = useQuery({ queryKey: ['regulatory', 'changes', 'watchlist'], queryFn: regulatoryChangeService.watchlist }); return <RegulatoryLayout current="Update Monitoring Foundation"><div className="space-y-5"><RegulatoryHeader title="Update Monitoring Foundation" subtitle="Approved-source watchlist only. No automatic fetching, scraping, or legal interpretation is performed." onRefresh={() => void query.refetch()} />{query.isLoading ? <RegulatoryLoadingState rows={5} /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => void query.refetch()} /> : <RegulatoryCard title="Sources"><pre className="max-h-[600px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></RegulatoryCard>}</div></RegulatoryLayout>; }
