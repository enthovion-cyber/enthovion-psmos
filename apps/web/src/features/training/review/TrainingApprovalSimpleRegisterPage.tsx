'use client';

import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingApprovalEsignatures, useTrainingApprovalEscalations } from '../hooks/useTrainingApprovalSettings';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingReviewInboxTable } from './TrainingReviewInboxTable';

export function TrainingApprovalSimpleRegisterPage({ type }: { type: 'esignatures' | 'escalations' }) {
  const esign = useTrainingApprovalEsignatures();
  const escalation = useTrainingApprovalEscalations();
  const query = type === 'esignatures' ? esign : escalation;
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingReviewHeader title={type === 'esignatures' ? 'E-Signatures' : 'Escalations'} subtitle={type === 'esignatures' ? 'Universal E-Signature links associated with Training approval decisions.' : 'Escalated approval packages, target roles/users, reasons and resolution status.'} onRefresh={() => query.refetch()} /><TrainingReviewInboxTable rows={query.data?.rows} title={type === 'esignatures' ? 'E-signature links' : 'Escalations'} /></div>;
}
