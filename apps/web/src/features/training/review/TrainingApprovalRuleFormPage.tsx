'use client';

import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingApprovalRule } from '../hooks/useTrainingApprovalRules';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingApprovalRuleForm } from './TrainingApprovalRuleForm';

export function TrainingApprovalRuleFormPage({ ruleId }: { ruleId?: string | undefined }) {
  const query = useTrainingApprovalRule(ruleId);
  if (ruleId && query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingReviewHeader title={ruleId ? 'Edit Approval Rule' : 'New Approval Rule'} subtitle="Step-based approval rule builder for triggers, stages, validation, e-signature, escalation and source locking." /><TrainingApprovalRuleForm ruleId={ruleId} initial={query.data?.rule ?? query.data} /></div>;
}
