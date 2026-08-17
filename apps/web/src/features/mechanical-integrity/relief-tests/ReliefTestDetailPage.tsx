'use client';

import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useReliefTest } from '../hooks/useReliefTests';
import { useReliefTestMutations } from '../hooks/useReliefTestMutations';
import { ReliefTestEvaluationPanel } from './ReliefTestEvaluationPanel';
import { ReliefTestReviewPanel } from './ReliefTestReviewPanel';

function JsonPanel({ title, data }: { title: string; data?: Record<string, unknown> | null | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="font-semibold">{title}</h2>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(data ?? {}, null, 2)}</pre>
    </section>
  );
}

export function ReliefTestDetailPage({ testId, reviewMode }: { testId: string; reviewMode?: boolean }) {
  const query = useReliefTest(testId);
  const mutations = useReliefTestMutations(testId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Relief test could not be loaded.</div>;
  const detail = query.data;
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h1 className="text-2xl font-bold">{detail.test.testRecordNumber ?? detail.test.test_record_number}</h1>
        <p className="text-sm text-[var(--psm-muted)]">Relief test detail, backend evaluation, certificates, and approval workflow.</p>
      </header>
      <ReliefTestEvaluationPanel detail={detail} onEvaluate={() => mutations.evaluate.mutate()} />
      {reviewMode ? <ReliefTestReviewPanel testId={testId} /> : null}
      <div className="grid gap-5 xl:grid-cols-2">
        <JsonPanel title="Test record" data={detail.test as unknown as Record<string, unknown>} />
        <JsonPanel title="Result calculation" data={detail.result} />
        <JsonPanel title="Leak test" data={detail.leakTest} />
        <JsonPanel title="Certificates" data={{ certificates: detail.certificates ?? [] }} />
      </div>
    </div>
  );
}
