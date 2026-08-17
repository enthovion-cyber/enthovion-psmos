'use client';

import { useMatrixRule } from '../hooks/useMatrixRules';
import { TrainingBadge, TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { MatrixRuleTable } from './MatrixRuleTable';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';

export function MatrixRuleDetailPage({ ruleId }: { ruleId: string }) {
  const query = useMatrixRule(ruleId);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const rule = query.data?.rule ?? {};
  const preview = query.data?.affectedWorkersPreview ?? {};
  return <div className="space-y-5"><TrainingMatrixHeader title={rule.rule_title ?? 'Matrix Rule'} /><div className="flex flex-wrap gap-2"><TrainingButton href={`/training-competency/training-matrix/rules/${ruleId}/edit`}>Edit</TrainingButton><TrainingButton href="/training-competency/training-matrix/rules" variant="secondary">Back to Rules</TrainingButton></div><MatrixRuleTable rows={[rule]} /><TrainingCard title="Review & Activate Preview" subtitle="Backend preview of affected workers and blocking impact."><div className="grid gap-3 md:grid-cols-4"><Metric label="Affected workers" value={preview.totalAffectedWorkers ?? 0} /><Metric label="Estimated current gaps" value={preview.estimatedCurrentGaps ?? 0} /><Metric label="Affected sites" value={(preview.affectedSites ?? []).length} /><div><p className="text-xs uppercase text-[var(--psm-muted)]">Blocking impact</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(preview.blockingImpact ?? {}).map(([k, v]) => <TrainingBadge key={k} tone={v ? 'danger' : 'neutral'}>{k}: {v ? 'Yes' : 'No'}</TrainingBadge>)}</div></div></div></TrainingCard></div>;
}

function Metric({ label, value }: { label: string; value: any }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
