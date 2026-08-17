'use client';

import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useReliefTest } from '../hooks/useReliefTests';
import { ReliefTestForm } from './ReliefTestForm';

export function ReliefTestFormPage({ testId }: { testId?: string }) {
  const query = useReliefTest(testId);
  if (testId && query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (testId && (query.isError || !query.data)) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Relief test could not be loaded.</div>;
  return <div className="space-y-5"><header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h1 className="text-2xl font-bold">{testId ? 'Edit Relief Test' : 'New Relief Test'}</h1><p className="text-sm text-[var(--psm-muted)]">Capture as-found/as-left, repair, leak, certificate, and evidence data.</p></header><ReliefTestForm initial={query.data} /></div>;
}
