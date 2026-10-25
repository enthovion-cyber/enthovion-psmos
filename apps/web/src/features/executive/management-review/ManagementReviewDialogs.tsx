'use client';

import React, { useState } from 'react';
import { X, Loader2, Calendar, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useManagementReviewContext, useManagementReviewMutations } from '../hooks/useExecutiveManagementReview';

const inputCls = 'mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]';

export function CreateReviewCycleDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const context = useManagementReviewContext();
  const mutations = useManagementReviewMutations();

  const [title, setTitle] = useState('');
  const [cycleType, setCycleType] = useState('Company Management Review');
  const [governanceLevel, setGovernanceLevel] = useState('Executive');
  const [reportingStart, setReportingStart] = useState('');
  const [reportingEnd, setReportingEnd] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const users = (context.data?.users ?? []) as Array<{ id: string; displayName?: string; email?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reportingStart || !reportingEnd || !ownerId) return;
    await mutations.createCycle.mutateAsync({
      title: title.trim(),
      cycleType,
      governanceLevel,
      reportingStart,
      reportingEnd,
      ownerId,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Create Management Review Cycle</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Cycle Title</label>
            <input
              required
              className={inputCls}
              placeholder="e.g. Q4 2026 Corporate Process Safety Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Review Type</label>
              <select className={inputCls} value={cycleType} onChange={(e) => setCycleType(e.target.value)}>
                <option>Company Management Review</option>
                <option>Corporate Management Review</option>
                <option>Site Management Review</option>
                <option>Special Critical Risk Review</option>
                <option>Post-Audit Management Review</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Governance Level</label>
              <select className={inputCls} value={governanceLevel} onChange={(e) => setGovernanceLevel(e.target.value)}>
                <option>Executive</option>
                <option>Board / Corporate</option>
                <option>Plant Leadership</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Reporting Period Start</label>
              <input
                required
                type="date"
                className={inputCls}
                value={reportingStart}
                onChange={(e) => setReportingStart(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Reporting Period End</label>
              <input
                required
                type="date"
                className={inputCls}
                value={reportingEnd}
                onChange={(e) => setReportingEnd(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Cycle Owner</label>
            <select
              required
              className={inputCls}
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">Select an active executive</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.email || u.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Scope &amp; Governance Notes</label>
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Optional strategic focus or special review instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createCycle.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createCycle.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ScheduleReviewMeetingDialog({
  isOpen,
  onClose,
  defaultCycleId,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultCycleId?: string | undefined;
}) {
  const context = useManagementReviewContext();
  const mutations = useManagementReviewMutations();

  const [cycleId, setCycleId] = useState(defaultCycleId || '');
  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('Quarterly Executive Review');
  const [chairpersonId, setChairpersonId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [mode, setMode] = useState('Virtual');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  if (!isOpen) return null;

  const users = (context.data?.users ?? []) as Array<{ id: string; displayName?: string; email?: string }>;
  const cycles = (context.data?.cycles ?? []) as Array<{ id: string; cycle_title?: string; cycle_code?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId || !title.trim() || !chairpersonId || !startAt || !endAt) return;
    await mutations.createMeeting.mutateAsync({
      cycleId,
      title: title.trim(),
      meetingType,
      chairpersonId,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      mode,
      location: location.trim() || undefined,
      timezone,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Schedule Leadership Review Meeting</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Review Cycle</label>
            <select
              required
              className={inputCls}
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
            >
              <option value="">Select active review cycle</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cycle_title || c.cycle_code || c.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Meeting Title</label>
            <input
              required
              className={inputCls}
              placeholder="e.g. Executive PSM Performance & Risk Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Meeting Chairperson</label>
              <select
                required
                className={inputCls}
                value={chairpersonId}
                onChange={(e) => setChairpersonId(e.target.value)}
              >
                <option value="">Select chairperson</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Meeting Mode</label>
              <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option>Virtual</option>
                <option>In Person</option>
                <option>Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date &amp; Time</label>
              <input
                required
                type="datetime-local"
                className={inputCls}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>End Date &amp; Time</label>
              <input
                required
                type="datetime-local"
                className={inputCls}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Location / Conference Link</label>
              <input
                className={inputCls}
                placeholder="Boardroom A or Meeting Link"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Time Zone</label>
              <input
                required
                className={inputCls}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createMeeting.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createMeeting.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RecordExecutiveDecisionDialog({
  isOpen,
  onClose,
  defaultMeetingId,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultMeetingId?: string | undefined;
}) {
  const context = useManagementReviewContext();
  const mutations = useManagementReviewMutations();

  const [meetingId, setMeetingId] = useState(defaultMeetingId || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Direct Corrective Action');
  const [description, setDescription] = useState('');
  const [rationale, setRationale] = useState('');
  const [decisionMakerId, setDecisionMakerId] = useState('');
  const [authorityRole, setAuthorityRole] = useState('Plant Manager');
  const [criticality, setCriticality] = useState('Safety Critical');
  const [ownerId, setOwnerId] = useState('');
  const [dueAt, setDueAt] = useState('');

  if (!isOpen) return null;

  const users = (context.data?.users ?? []) as Array<{ id: string; displayName?: string; email?: string }>;
  const meetings = (context.data?.meetings ?? []) as Array<{ id: string; meeting_title?: string; meeting_code?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId || !title.trim() || !description.trim() || !decisionMakerId) return;
    await mutations.createDecision.mutateAsync({
      meetingId,
      title: title.trim(),
      type,
      description: description.trim(),
      rationale: rationale.trim() || undefined,
      decisionMakerId,
      authorityRole,
      criticality,
      ownerId: ownerId || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Record Executive Management Decision</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Meeting Context</label>
            <select
              required
              className={inputCls}
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
            >
              <option value="">Select meeting</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.meeting_title || m.meeting_code || m.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Decision Title</label>
            <input
              required
              className={inputCls}
              placeholder="e.g. Mandate Safety Instrumented System Proof Testing Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Decision Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                <option>Direct Corrective Action</option>
                <option>Require Root Cause Investigation</option>
                <option>Request Technical Risk Assessment</option>
                <option>Allocate Resources</option>
                <option>Prioritize Maintenance Work</option>
                <option>Request PHA/LOPA Review</option>
                <option>Assign Management Commitment</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Criticality</label>
              <select className={inputCls} value={criticality} onChange={(e) => setCriticality(e.target.value)}>
                <option>Safety Critical</option>
                <option>High Priority</option>
                <option>Medium Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Decision Description &amp; Scope</label>
            <textarea
              required
              rows={2}
              className={inputCls}
              placeholder="State the formal executive ruling or mandate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Management Rationale</label>
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Safety reasoning, barrier impairment basis, or regulatory driver..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Decision Maker</label>
              <select
                required
                className={inputCls}
                value={decisionMakerId}
                onChange={(e) => setDecisionMakerId(e.target.value)}
              >
                <option value="">Select decision maker</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Authority Role</label>
              <input
                required
                className={inputCls}
                value={authorityRole}
                onChange={(e) => setAuthorityRole(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Follow-Up Action Owner</label>
              <select
                className={inputCls}
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">Assign responsible owner</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Target Completion Date</label>
              <input
                type="date"
                className={inputCls}
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createDecision.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createDecision.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Record Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateManagementCommitmentDialog({
  isOpen,
  onClose,
  defaultMeetingId,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultMeetingId?: string | undefined;
}) {
  const context = useManagementReviewContext();
  const mutations = useManagementReviewMutations();

  const [meetingId, setMeetingId] = useState(defaultMeetingId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [priority, setPriority] = useState('SAFETY_CRITICAL');
  const [dueAt, setDueAt] = useState('');

  if (!isOpen) return null;

  const users = (context.data?.users ?? []) as Array<{ id: string; displayName?: string; email?: string }>;
  const meetings = (context.data?.meetings ?? []) as Array<{ id: string; meeting_title?: string; meeting_code?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !ownerId) return;
    await mutations.createCommitment.mutateAsync({
      meetingId: meetingId || undefined,
      title: title.trim(),
      description: description.trim(),
      ownerId,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Create Leadership Commitment</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Meeting Reference (Optional)</label>
            <select
              className={inputCls}
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
            >
              <option value="">Select meeting context</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.meeting_title || m.meeting_code || m.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Commitment Title</label>
            <input
              required
              className={inputCls}
              placeholder="e.g. Procure Replacement Relief Valves for Unit 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Obligation Scope &amp; Deliverables</label>
            <textarea
              required
              rows={2}
              className={inputCls}
              placeholder="Actionable commitment description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Commitment Owner</label>
              <select
                required
                className={inputCls}
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">Select responsible person</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="SAFETY_CRITICAL">Safety Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Target Completion Date</label>
            <input
              type="date"
              className={inputCls}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createCommitment.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createCommitment.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Commitment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CarryForwardCommitmentDialog({
  isOpen,
  onClose,
  commitmentId,
  commitmentTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  commitmentTitle: string;
}) {
  const context = useManagementReviewContext();
  const mutations = useManagementReviewMutations();
  const [targetCycleId, setTargetCycleId] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const cycles = (context.data?.cycles ?? []) as Array<{ id: string; cycle_title?: string; cycle_code?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await mutations.carryForward.mutateAsync({
      id: commitmentId,
      body: {
        reason: reason.trim(),
        targetCycleId: targetCycleId || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded p-1 bg-amber-500/10 text-amber-500">
              <ArrowRight size={16} />
            </span>
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Carry Forward Commitment</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <p className="mt-2 text-xs text-[var(--psm-muted)]">
          Carrying forward <strong className="text-[var(--psm-text)]">{commitmentTitle}</strong> to the next governance cycle. The underlying issue remains transparently tracked without duplicating source actions.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Target Review Cycle (Optional)</label>
            <select
              className={inputCls}
              value={targetCycleId}
              onChange={(e) => setTargetCycleId(e.target.value)}
            >
              <option value="">Next scheduled cycle</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cycle_title || c.cycle_code || c.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Carry-Forward Reason &amp; Mitigation Strategy</label>
            <textarea
              required
              rows={3}
              className={inputCls}
              placeholder="Provide justification, e.g. awaiting shutdown window or capital appropriation approval..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.carryForward.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.carryForward.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirm Carry-Forward
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
