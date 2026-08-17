'use client';

import { useAssessmentAttempt } from '../hooks/useAssessmentAttempt';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { AssessmentGradingPanel } from './AssessmentGradingPanel';
import { AssessmentVerificationPanel } from './AssessmentVerificationPanel';

export function AssessmentAttemptPage({ attemptId }: { attemptId: string }) {
  const query = useAssessmentAttempt(attemptId);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data as Record<string, any> | undefined;
  return <div className="space-y-4"><AssessmentGradingPanel attempt={data?.attempt} /><AssessmentVerificationPanel result={data?.result} /></div>;
}
