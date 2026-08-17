'use client';

import { useReliefTestMutations } from '../hooks/useReliefTestMutations';

export function ReliefTestReviewPanel({ testId }: { testId: string }) {
  const mutations = useReliefTestMutations(testId);
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="font-semibold">Review Workflow</h2>
      <p className="text-sm text-[var(--psm-muted)]">Approved tests become locked and update relief device due/readiness status.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => mutations.submit.mutate('Submitted for review')}>Submit</button>
        <button type="button" className="rounded-lg bg-success px-3 py-2 text-sm font-semibold text-white" onClick={() => mutations.approve.mutate('Approved')}>Approve</button>
        <button type="button" className="rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white" onClick={() => mutations.reject.mutate('Rejected')}>Reject</button>
      </div>
    </section>
  );
}
