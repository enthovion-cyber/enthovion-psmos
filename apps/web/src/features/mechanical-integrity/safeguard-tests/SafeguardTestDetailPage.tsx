'use client';

import { useRouter } from 'next/navigation';
import { useSafeguardTestDetail, useSafeguardTestMutations } from '../hooks/useSafeguardTests';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ActionButton, KeyValueGrid, PrimaryButton, SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';

export function SafeguardTestDetailPage({ testId, reviewMode = false }: { testId: string; reviewMode?: boolean }) {
  const router = useRouter();
  const query = useSafeguardTestDetail(testId);
  const mutations = useSafeguardTestMutations();
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  const row = (query.data as any)?.test ?? (query.data as any)?.record;
  if (query.isError || !row) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Safeguard test could not be loaded.</div>;
  return <div className="space-y-5"><header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{reviewMode ? 'Review Safeguard Test' : 'Safeguard Test Detail'}</p><h1 className="text-2xl font-bold">{cardValue(row.testNumber ?? row.test_number)}</h1><p className="text-sm text-[var(--psm-muted)]">{cardValue(row.testScope ?? row.test_scope, 'No test scope recorded.')}</p></div><div className="flex flex-wrap gap-2"><PrimaryButton onClick={() => router.push(`/mechanical-integrity/safeguard-tests/${testId}/edit`)}>Edit</PrimaryButton><ActionButton onClick={() => mutations.evaluate.mutate(testId)}>Evaluate</ActionButton><ActionButton onClick={() => mutations.submit.mutate({ testId, input: { reason: 'Submitted from detail page' } })}>Submit</ActionButton><ActionButton onClick={() => mutations.approve.mutate({ testId, input: { reason: 'Approved from review page' } })}>Approve</ActionButton></div></header><section className="grid gap-5 xl:grid-cols-2"><SectionCard title="Test Data" description="Backend official test fields and calculated result."><KeyValueGrid items={Object.entries(row).slice(0, 18) as any} /></SectionCard><SectionCard title="Steps / Evaluation / Review" description="Steps, official evaluation, review status, evidence links, and corrective action triggers."><KeyValueGrid items={[['Final result', row.finalResult ?? row.final_result], ['Evaluation status', row.evaluationStatus ?? row.evaluation_status], ['Review status', row.reviewStatus ?? row.review_status], ['Failed step count', row.failedStepCount ?? row.failed_step_count], ['Evidence complete', row.evidenceComplete ?? row.evidence_complete]]} /></SectionCard></section></div>;
}
