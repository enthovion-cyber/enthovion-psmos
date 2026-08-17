'use client';

import { useRouter } from 'next/navigation';
import { useCriticalityRegistry } from '../hooks/useCriticalityRegistry';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { CriticalityTable } from './CriticalityTable';

export function CriticalityReviewQueuePage() {
  const router = useRouter();
  const query = useCriticalityRegistry({ approvalStatus: 'Pending Review' });
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Review queue could not be loaded.</div>;
  return <div className="space-y-5"><div className="rounded-xl border border-border bg-card p-5"><h1 className="text-xl font-semibold">Criticality Review Queue</h1><p className="text-sm text-muted-foreground">Assessments waiting for reviewer decision.</p></div><CriticalityTable rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/criticality/assessments/${row.id}`)} /></div>;
}
