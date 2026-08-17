'use client';

import { TrainingMetricCard } from '../shared/TrainingUi';

const cards: Array<[string, string, 'neutral' | 'good' | 'warn' | 'danger', string?]> = [
  ['Total Training Sessions', 'totalTrainingSessions', 'neutral', '/training-competency/training-records/sessions'],
  ['Sessions Scheduled', 'sessionsScheduled', 'neutral', '/training-competency/training-records/sessions?sessionStatus=Scheduled'],
  ['Sessions Completed', 'sessionsCompleted', 'good', '/training-competency/training-records/sessions?sessionStatus=Completed'],
  ['Sessions Cancelled', 'sessionsCancelled', 'danger', '/training-competency/training-records/sessions?sessionStatus=Cancelled'],
  ['Training Records Created', 'trainingRecordsCreated', 'neutral', '/training-competency/training-records/records'],
  ['Attendance Records', 'attendanceRecords', 'neutral', '/training-competency/training-records/attendance'],
  ['Present Attendance', 'presentAttendance', 'good'],
  ['Absent / No-Show', 'absentNoShow', 'danger'],
  ['Late Attendance', 'lateAttendance', 'warn'],
  ['Incomplete Attendance', 'incompleteAttendance', 'warn'],
  ['Verified Completions', 'verifiedCompletions', 'good'],
  ['Pending Verification', 'pendingVerification', 'warn', '/training-competency/training-records/pending-verification'],
  ['Pending Approval', 'pendingApproval', 'warn', '/training-competency/training-records/pending-approval'],
  ['Failed / Incomplete', 'failedIncompleteRecords', 'danger', '/training-competency/training-records/failed-incomplete'],
  ['Missing Evidence', 'missingEvidence', 'danger'],
  ['Manual Corrections', 'manualCorrections', 'warn', '/training-competency/training-records/manual-corrections'],
  ['Matrix Gaps Resolved', 'matrixGapsResolved', 'good'],
  ['Competency Gaps Resolved', 'competencyGapsResolved', 'good'],
  ['PTW Blockers Cleared', 'ptwBlockersCleared', 'good'],
  ['MOC/PSSR Blockers Cleared', 'mocPssrBlockersCleared', 'good'],
  ['Records Created This Month', 'recordsCreatedThisMonth', 'neutral']
];

export function TrainingRecordsSummaryCards({ summary }: { summary?: Record<string, any> }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">{cards.map(([label, key, tone, href]) => <TrainingMetricCard key={key} label={label} value={summary?.[key] ?? 0} tone={tone} href={href} />)}</div>;
}
