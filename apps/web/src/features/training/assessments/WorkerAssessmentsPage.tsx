'use client';

import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';
import { AssessmentAttemptStatusBadge } from '../shared/AssessmentAttemptStatusBadge';
import { AssessmentResultBadge } from '../shared/AssessmentResultBadge';
import { PassFailBadge } from '../shared/PassFailBadge';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function WorkerAssessmentsPage({ workerId, results }: { workerId: string; results?: boolean }) {
  const query = useQuery({ queryKey: ['training', 'worker', workerId, results ? 'assessment-results' : 'assessments'], queryFn: async () => results ? assessmentService.workerResults(workerId) as Promise<{ rows: Array<Record<string, any>> }> : assessmentService.workerAssignments(workerId) as Promise<{ rows: Array<Record<string, any>> }> });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return (
    <TrainingCard title={results ? 'Worker Assessment Results' : 'Worker Assessment Assignments'} subtitle={`Worker ${workerId}`}>
      {!rows.length ? <TrainingEmptyState title="No assessment records" message="No worker-specific assessment data was returned by the backend." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Assessment</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Due / completed</th></tr></thead>
            <tbody>
              {rows.map((row: Record<string, any>) => (
                <tr key={String(row.id)} className="border-t border-[var(--psm-line)]">
                  <td className="px-3 py-3">{String(row.assessment_id)}</td>
                  <td className="px-3 py-3">{results ? <AssessmentResultBadge status={row.result_status} /> : <AssessmentAttemptStatusBadge status={row.assignment_status} />}</td>
                  <td className="px-3 py-3">{results ? <PassFailBadge passed={row.passed} /> : 'Not attempted'}</td>
                  <td className="px-3 py-3">{String(row.completion_date ?? row.due_date ?? 'Not set')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TrainingCard>
  );
}
