'use client';

import Link from 'next/link';
import { TrainingButton, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingApprovalRules } from '../hooks/useTrainingApprovalRules';
import { TrainingReviewHeader } from './TrainingReviewHeader';

export function TrainingApprovalRuleRegistryPage() {
  const query = useTrainingApprovalRules();
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingReviewHeader title="Approval Rules" subtitle="Configurable Training approval triggers, stages, validation, e-signature and source locking rules." onRefresh={() => query.refetch()} actions={<TrainingButton href="/training-competency/review-approval/rules/new">New Rule</TrainingButton>} /><div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]"><table className="min-w-[1000px] w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Rule','Source Module','Record Type','Trigger','Safety Critical','Stages','E-Sign','Lock Source','Status','Owner','Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{query.data?.rows?.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/training-competency/review-approval/rules/${row.id}`}>{row.rule_code}</Link><p className="text-xs text-[var(--psm-muted)]">{row.rule_title}</p></td><td className="px-3 py-3">{row.source_module}</td><td className="px-3 py-3">{row.source_record_type}</td><td className="px-3 py-3">{row.trigger_event}</td><td className="px-3 py-3">{row.safety_critical_only ? 'Yes' : 'No'}</td><td className="px-3 py-3">{Array.isArray(row.stages_json) ? row.stages_json.length : 0}</td><td className="px-3 py-3">{row.esign_required ? 'Required' : 'No'}</td><td className="px-3 py-3">{row.lock_source_after_approval ? 'Yes' : 'No'}</td><td className="px-3 py-3">{row.rule_status}</td><td className="px-3 py-3">{row.owner_user_id ?? '-'}</td><td className="px-3 py-3"><Link className="text-primary" href={`/training-competency/review-approval/rules/${row.id}/edit`}>Edit</Link></td></tr>)}</tbody></table></div></div>;
}
