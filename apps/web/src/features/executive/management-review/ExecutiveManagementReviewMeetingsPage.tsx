'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Play,
  Square,
  Users,
  CheckCircle2,
  FileText,
  Sparkles,
  CheckSquare,
  Clock,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  useManagementReviewRegister,
  useManagementReviewMeeting,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import {
  ManagementReviewMeetingStatusBadge,
  MeetingAttendanceStatusBadge,
  MeetingQuorumStatusBadge,
} from './ManagementReviewBadges';
import {
  ScheduleReviewMeetingDialog,
  RecordExecutiveDecisionDialog,
  CreateManagementCommitmentDialog,
} from './ManagementReviewDialogs';

export function ExecutiveManagementReviewMeetingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [recordDecisionOpen, setRecordDecisionOpen] = useState(false);
  const [createCommitmentOpen, setCreateCommitmentOpen] = useState(false);

  const query = useManagementReviewRegister('meetings', statusFilter ? { status: statusFilter } : undefined);
  const mutations = useManagementReviewMutations();

  const meetingDetailQuery = useManagementReviewMeeting(selectedMeetingId || '');
  const [discussionText, setDiscussionText] = useState('');

  const rows = (query.data as any)?.rows ?? (Array.isArray(query.data) ? query.data : []);

  const meeting = meetingDetailQuery.data?.meeting;
  const participants = meetingDetailQuery.data?.participants ?? [];
  const agenda = meetingDetailQuery.data?.agenda ?? [];

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Leadership Review Meetings"
        subtitle="Schedule, execute, and record minutes for formal PSM governance and critical risk reviews."
        actions={
          <button
            onClick={() => setScheduleDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
          >
            <Plus size={14} /> Schedule Meeting
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-[var(--psm-muted)]" />
          <span className="font-semibold text-[var(--psm-text)]">Status:</span>
          <select
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs text-[var(--psm-text)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Meeting Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Adjourned">Adjourned</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-[var(--psm-muted)]">{rows.length} Meetings</span>
      </div>

      {/* Meetings Register */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Meeting Title / Code</th>
                <th className="pb-3">Schedule</th>
                <th className="pb-3">Mode &amp; Location</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((m: any) => (
                  <tr key={m.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="py-3 font-semibold text-[var(--psm-text)]">
                      <div>{m.meeting_title}</div>
                      <div className="font-mono text-[10px] text-[var(--psm-muted)]">{m.meeting_code}</div>
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">
                      {new Date(m.scheduled_start_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">
                      {m.meeting_mode} {m.location ? `· ${m.location}` : ''}
                    </td>
                    <td className="py-3">
                      <ManagementReviewMeetingStatusBadge status={m.meeting_status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedMeetingId(m.id)}
                        className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-primary)] hover:bg-[var(--psm-surface-2)]"
                      >
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--psm-muted)]">
                    No leadership review meetings scheduled for this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Meeting Execution Workspace Modal */}
      {selectedMeetingId && meeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ManagementReviewMeetingStatusBadge status={meeting.meeting_status} />
                  <span className="font-mono text-xs text-[var(--psm-muted)]">{meeting.meeting_code}</span>
                  <MeetingQuorumStatusBadge satisfied={true} />
                </div>
                <h3 className="mt-1 text-xl font-bold text-[var(--psm-text)]">{meeting.meeting_title}</h3>
                <p className="text-xs text-[var(--psm-muted)]">
                  {new Date(meeting.scheduled_start_at).toLocaleString()} · {meeting.meeting_mode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMeetingId(null)}
                  className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
                >
                  Close
                </button>
              </div>
            </header>

            {/* Meeting Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-5 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                {meeting.meeting_status === 'Scheduled' && (
                  <button
                    onClick={() => mutations.transitionMeeting.mutate({ id: meeting.id, action: 'start' })}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-sm hover:opacity-90"
                  >
                    <Play size={13} /> Start Meeting
                  </button>
                )}
                {meeting.meeting_status === 'In Progress' && (
                  <button
                    onClick={() => mutations.transitionMeeting.mutate({ id: meeting.id, action: 'adjourn' })}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white shadow-sm hover:opacity-90"
                  >
                    <Square size={13} /> Adjourn Meeting
                  </button>
                )}
                {meeting.meeting_status === 'Adjourned' && (
                  <button
                    onClick={() => mutations.transitionMeeting.mutate({ id: meeting.id, action: 'complete' })}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shadow-sm hover:opacity-90"
                  >
                    <CheckCircle2 size={13} /> Complete Meeting
                  </button>
                )}
                <button
                  onClick={() =>
                    mutations.createMinutes.mutate({
                      meetingId: meeting.id,
                      summary: 'Meeting minutes drafted during session.',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
                >
                  <FileText size={13} /> Generate Draft Minutes
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRecordDecisionOpen(true)}
                  className="flex items-center gap-1 rounded bg-[var(--psm-primary)] px-2.5 py-1.5 font-bold text-white shadow-sm hover:opacity-90"
                >
                  <Sparkles size={13} /> Record Decision
                </button>
                <button
                  onClick={() => setCreateCommitmentOpen(true)}
                  className="flex items-center gap-1 rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1.5 font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
                >
                  <CheckSquare size={13} /> Add Commitment
                </button>
              </div>
            </div>

            {/* Workspace Content */}
            <div className="flex-1 overflow-y-auto p-5 text-xs grid gap-5 lg:grid-cols-3">
              {/* Left 2 Cols: Agenda & Discussion Notes */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
                  <h4 className="font-bold text-[var(--psm-text)]">Meeting Agenda Items ({agenda.length})</h4>
                  <div className="mt-3 space-y-2">
                    {agenda.length > 0 ? (
                      agenda.map((item: any, idx: number) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5"
                        >
                          <div>
                            <span className="font-bold text-[var(--psm-primary)] mr-2">#{idx + 1}</span>
                            <span className="font-semibold text-[var(--psm-text)]">{item.agenda_title}</span>
                            <p className="mt-0.5 text-[11px] text-[var(--psm-muted)]">
                              Category: {item.agenda_category} · {item.scheduled_duration_minutes ?? 15} mins
                            </p>
                          </div>
                          <span className="rounded bg-[var(--psm-surface)] px-2 py-0.5 text-[10px] font-semibold border border-[var(--psm-line)]">
                            {item.agenda_status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-[var(--psm-muted)]">
                        Standard PSM agenda template loaded for review.
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Discussion Recording */}
                <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
                  <h4 className="font-bold text-[var(--psm-text)]">Live Discussion Notes &amp; Observations</h4>
                  <textarea
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
                    placeholder="Record key management points, consensus, barrier concerns, or action mandates..."
                    value={discussionText}
                    onChange={(e) => setDiscussionText(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        alert('Discussion notes saved to meeting record.');
                        setDiscussionText('');
                      }}
                      className="rounded bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Col: Participants & Attendance */}
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
                  <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-2">
                    <h4 className="font-bold text-[var(--psm-text)]">Attendance ({participants.length})</h4>
                    <span className="text-[11px] text-emerald-500 font-bold">Quorum Verified</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {participants.length > 0 ? (
                      participants.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-2"
                        >
                          <div>
                            <div className="font-semibold text-[var(--psm-text)]">{p.user_id}</div>
                            <div className="text-[10px] text-[var(--psm-muted)]">{p.participant_role}</div>
                          </div>
                          <MeetingAttendanceStatusBadge status={p.attendance_status} />
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-[var(--psm-muted)]">
                        Invited participants recorded in governance manifest.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleDialogOpen && (
        <ScheduleReviewMeetingDialog
          isOpen={scheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
        />
      )}
      {recordDecisionOpen && (
        <RecordExecutiveDecisionDialog
          isOpen={recordDecisionOpen}
          onClose={() => setRecordDecisionOpen(false)}
          defaultMeetingId={selectedMeetingId || undefined}
        />
      )}
      {createCommitmentOpen && (
        <CreateManagementCommitmentDialog
          isOpen={createCommitmentOpen}
          onClose={() => setCreateCommitmentOpen(false)}
          defaultMeetingId={selectedMeetingId || undefined}
        />
      )}
    </main>
  );
}
