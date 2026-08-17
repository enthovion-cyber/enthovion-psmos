'use client';

import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function AssessmentImportPage() {
  const query = useQuery({ queryKey: ['training', 'assessments', 'import-template'], queryFn: () => assessmentService.importTemplate() });
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <TrainingCard title="Assessment Import" subtitle="Use this backend-generated template; imported rows create audit and history events."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></TrainingCard>;
}
