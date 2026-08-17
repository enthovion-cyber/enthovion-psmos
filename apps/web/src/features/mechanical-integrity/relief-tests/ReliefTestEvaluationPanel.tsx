import { LeakTestResultBadge } from '../shared/LeakTestResultBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PopTestResultBadge } from '../shared/PopTestResultBadge';
import { ReliefTestResultBadge } from '../shared/ReliefTestResultBadge';

export function ReliefTestEvaluationPanel({ detail, onEvaluate }: { detail?: any; onEvaluate?: () => void }) {
  const result = detail?.result ?? {};
  const leak = detail?.leakTest ?? {};
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Backend Test Evaluation</h2>
          <p className="text-sm text-[var(--psm-muted)]">Official pop/leak pass-fail is calculated on the backend from set pressure, tolerance, as-found/as-left data, and leak results.</p>
        </div>
        {onEvaluate ? <button type="button" onClick={onEvaluate} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Evaluate</button> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ReliefTestResultBadge result={detail?.test?.final_result ?? detail?.test?.finalResult} />
        <PopTestResultBadge result={result.as_found_pop_result} />
        <PopTestResultBadge result={result.as_left_pop_result} />
        <LeakTestResultBadge result={leak.pass_fail ?? result.as_left_leak_result} />
        <MocRequiredBadge required={result.moc_required} />
      </div>
    </section>
  );
}
