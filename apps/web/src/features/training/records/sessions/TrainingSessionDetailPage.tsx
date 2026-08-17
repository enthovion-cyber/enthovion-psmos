'use client';

import { useTrainingSessionDetail } from '../../hooks/useTrainingSessionDetail';
import { TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { TrainingSessionDetailHeader } from './TrainingSessionDetailHeader';
import { SessionAttendanceTab } from './tabs/SessionAttendanceTab';
import { SessionCompletionsTab } from './tabs/SessionCompletionsTab';
import { SessionEvidenceDocumentsTab } from './tabs/SessionEvidenceDocumentsTab';
import { SessionHistoryTab } from './tabs/SessionHistoryTab';
import { SessionInstructorTab } from './tabs/SessionInstructorTab';
import { SessionLinkedGapsTab } from './tabs/SessionLinkedGapsTab';
import { SessionOverviewTab } from './tabs/SessionOverviewTab';
import { SessionReviewApprovalTab } from './tabs/SessionReviewApprovalTab';
import { SessionRosterTab } from './tabs/SessionRosterTab';
import { SessionScheduleTab } from './tabs/SessionScheduleTab';
import { SessionTrainingItemTab } from './tabs/SessionTrainingItemTab';

export function TrainingSessionDetailPage({ sessionId, focus }: { sessionId: string; focus?: 'roster' | 'attendance' | 'evidence' | 'completions' }) {
  const query = useTrainingSessionDetail(sessionId);
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  if (!query.data?.session) return <TrainingEmptyState title="Session not found" message="No training session was returned for this ID and scope." />;
  const data = query.data;
  if (focus === 'attendance') return <div className="space-y-5"><TrainingSessionDetailHeader session={data.session} /><SessionAttendanceTab sessionId={sessionId} rows={data.attendance} /></div>;
  if (focus === 'roster') return <div className="space-y-5"><TrainingSessionDetailHeader session={data.session} /><SessionRosterTab sessionId={sessionId} rows={data.roster} /></div>;
  if (focus === 'evidence') return <div className="space-y-5"><TrainingSessionDetailHeader session={data.session} /><SessionEvidenceDocumentsTab rows={data.evidence} /></div>;
  if (focus === 'completions') return <div className="space-y-5"><TrainingSessionDetailHeader session={data.session} /><SessionCompletionsTab rows={data.completionRecords} /></div>;
  return (
    <div className="space-y-5">
      <TrainingSessionDetailHeader session={data.session} />
      <SessionOverviewTab data={data} />
      <div className="grid gap-4 xl:grid-cols-2">
        <SessionTrainingItemTab session={data.session} />
        <SessionScheduleTab session={data.session} />
        <SessionInstructorTab session={data.session} />
        <SessionReviewApprovalTab data={data} />
      </div>
      <SessionRosterTab sessionId={sessionId} rows={data.roster} />
      <SessionAttendanceTab sessionId={sessionId} rows={data.attendance} />
      <SessionCompletionsTab rows={data.completionRecords} />
      <div className="grid gap-4 xl:grid-cols-2">
        <SessionEvidenceDocumentsTab rows={data.evidence} />
        <SessionLinkedGapsTab rows={data.links} />
      </div>
      <SessionHistoryTab rows={data.history ?? []} />
    </div>
  );
}
