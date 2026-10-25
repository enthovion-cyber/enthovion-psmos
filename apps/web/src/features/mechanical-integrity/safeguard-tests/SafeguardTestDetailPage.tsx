'use client';

import Link from 'next/link';
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

  const finalResult = String(row.finalResult ?? row.final_result ?? '');
  const isFailed = /fail/i.test(finalResult);
  const isPassed = /pass/i.test(finalResult);

  return (
    <div className="space-y-5">
      {/* Critical Failure Emergency Banner */}
      {isFailed ? (
        <div className="rounded-xl border border-danger bg-danger/10 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <h2 className="text-lg font-bold text-danger">CRITICAL BARRIER FAILURE: Safeguard Proof Test Failed</h2>
              </div>
              <p className="mt-1 text-sm text-danger/90">
                Final evaluation: <strong>{finalResult}</strong>. In compliance with OSHA 1910.119(j) and IEC 61511, this safety-critical barrier is now <strong>Degraded</strong> and unit startup is <strong>Blocked</strong>. Corrective action spawned in Action Center and plant notifications dispatched.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/actions"
                className="rounded-lg bg-danger px-3 py-2 text-xs font-bold text-white shadow hover:bg-danger/90"
              >
                Go to Action Center
              </Link>
              <Link
                href="/mechanical-integrity/impairments"
                className="rounded-lg border border-danger/40 bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5"
              >
                View Impairments
              </Link>
            </div>
          </div>
        </div>
      ) : isPassed ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
            <span>✅</span>
            <span>Proof Test Verified: All functional safety criteria satisfied. Safety Integrity Level (SIL) barrier assurance validated.</span>
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{reviewMode ? 'Review Safeguard Test' : 'Safeguard Test Detail'}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--psm-text)]">{cardValue(row.testNumber ?? row.test_number)}</h1>
            {isFailed ? (
              <span className="rounded-md border border-danger/40 bg-danger/20 px-2.5 py-0.5 text-xs font-bold text-danger">
                FAILED
              </span>
            ) : isPassed ? (
              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                PASSED
              </span>
            ) : null}
          </div>
          <p className="text-sm text-[var(--psm-muted)]">{cardValue(row.testScope ?? row.test_scope, 'No test scope recorded.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => router.push(`/mechanical-integrity/safeguard-tests/${testId}/edit`)}>Edit</PrimaryButton>
          <ActionButton onClick={() => mutations.evaluate.mutate(testId)}>Evaluate</ActionButton>
          <ActionButton onClick={() => mutations.submit.mutate({ testId, input: { reason: 'Submitted from detail page' } })}>Submit</ActionButton>
          <ActionButton onClick={() => mutations.approve.mutate({ testId, input: { reason: 'Approved from review page' } })}>Approve</ActionButton>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Test Data" description="Backend official test fields and calculated result.">
          <KeyValueGrid items={Object.entries(row).slice(0, 18) as any} />
        </SectionCard>
        <SectionCard title="Steps / Evaluation / Review" description="Steps, official evaluation, review status, evidence links, and corrective action triggers.">
          <KeyValueGrid items={[
            ['Final result', row.finalResult ?? row.final_result],
            ['Startup Blocked', isFailed ? 'YES (Startup Blocked)' : 'No'],
            ['Evaluation status', row.evaluationStatus ?? row.evaluation_status],
            ['Review status', row.reviewStatus ?? row.review_status],
            ['Failed step count', row.failedStepCount ?? row.failed_step_count],
            ['Evidence complete', row.evidenceComplete ?? row.evidence_complete]
          ]} />
        </SectionCard>
      </section>
    </div>
  );
}
