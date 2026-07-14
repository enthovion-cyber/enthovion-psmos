'use client';

import { useEffect, useMemo, useState } from 'react';
import { AddEditReviewerDialog } from '../review-signoff/AddEditReviewerDialog';
import { ApprovalDecisionPanel } from '../review-signoff/ApprovalDecisionPanel';
import { ApprovalSnapshotPanel } from '../review-signoff/ApprovalSnapshotPanel';
import { CommentDetailDrawer } from '../review-signoff/CommentDetailDrawer';
import { ESignaturePanel } from '../review-signoff/ESignaturePanel';
import { NotificationsRemindersPanel } from '../review-signoff/NotificationsRemindersPanel';
import { OpenBlockersRequiredActionsPanel } from '../review-signoff/OpenBlockersRequiredActionsPanel';
import { ReopenRevisionControlPanel } from '../review-signoff/ReopenRevisionControlPanel';
import { ReviewCommentsPanel } from '../review-signoff/ReviewCommentsPanel';
import { ReviewReadinessBlockersPanel } from '../review-signoff/ReviewReadinessBlockersPanel';
import { ReviewerApproverRegister } from '../review-signoff/ReviewerApproverRegister';
import { ReviewSignoffBulkActions } from '../review-signoff/ReviewSignoffBulkActions';
import { ReviewSignoffFilters } from '../review-signoff/ReviewSignoffFilters';
import { ReviewSignoffHeader } from '../review-signoff/ReviewSignoffHeader';
import { ReviewSummaryCards } from '../review-signoff/ReviewSummaryCards';
import { ReviewWorkflowTimeline } from '../review-signoff/ReviewWorkflowTimeline';
import { SectionCompletionChecklist } from '../review-signoff/SectionCompletionChecklist';
import { useLopaReviewMutations, useLopaReviewSignoff } from '../../hooks/useLopaReviewSignoff';
import type { LopaReviewFilters } from '../../types/lopa-review-signoff.types';
import { useAuthStore } from '@/stores/auth.store';

export function LopaReviewSignoffTab({ id, onSelectTab }: { id: string; onSelectTab?: (tab: string) => void }) {
  const [filters, setFilters] = useState<LopaReviewFilters>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [editor, setEditor] = useState<any | null>(null);
  const [comment, setComment] = useState<any | null>(null);
  const query = useLopaReviewSignoff(id);
  const mutations = useLopaReviewMutations(id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  useEffect(() => { setCurrentUserId(jwtSubject(accessToken ?? window.localStorage.getItem('psm.accessToken'))); }, [accessToken]);
  const data = query.data;
  const busy = Object.values(mutations).some((mutation: any) => mutation.isPending);

  const filtered = useMemo(() => {
    if (!data) return { participants: [], comments: [] };
    const q = (filters.q ?? '').toLowerCase();
    const participants = data.participants.filter((row: any) => (!filters.decision || row.decision === filters.decision) && (!filters.signatureStatus || row.signature_status === filters.signatureStatus) && (!q || [row.user?.displayName, row.user?.email, row.review_role, row.discipline].some((value) => String(value ?? '').toLowerCase().includes(q))));
    const comments = data.comments.filter((row: any) => (!filters.commentStatus || row.status === filters.commentStatus) && (filters.blocking !== 'true' || row.blocking) && (!q || [row.title, row.comment_text, row.comment_number, row.related_tab].some((value) => String(value ?? '').toLowerCase().includes(q))));
    return { participants, comments };
  }, [data, filters]);

  function success(text: string) { setMessage({ tone: 'success', text }); }
  function fail(error: any, fallback: string) { const raw = error?.response?.data?.message ?? error?.message ?? fallback; setMessage({ tone: 'error', text: typeof raw === 'string' ? raw : fallback }); }
  function reason(label: string) { return window.prompt(label) ?? ''; }
  function run(mutation: any, input: any, ok: string, fallback: string) { mutation.mutate(input, { onSuccess: () => success(ok), onError: (error: any) => fail(error, fallback) }); }
  function openRelated(checkKey: string) { const tabs: Record<string, string> = { overview: 'overview', scenario_consequence: 'scenario', initiating_event: 'initiating-event', conditional_modifiers: 'initiating-event', ipls: 'ipls', risk_calculation: 'risk-calculation', risk_recalculation: 'risk-calculation', risk_gap: 'risk-calculation', sil: 'sil', recommendations: 'actions', linked_records: 'linked-records', team_sessions: 'team-sessions' }; onSelectTab?.(tabs[checkKey] ?? 'review'); }

  if (query.isLoading) return <State text="Loading Review & Sign-Off from the LOPA API..." />;
  if (query.isError || !data) return <State tone="error" text="Unable to load Review & Sign-Off. Confirm your review permission, study site access, and review schema migration." />;

  const readOnly = !!data.readOnly;
  return <section className="space-y-4">
    {message ? <Toast {...message} onClose={() => setMessage(null)} /> : null}
    <ReviewSignoffHeader header={data.header} readOnly={readOnly} busy={busy} onRefresh={() => run(mutations.refreshReadiness, undefined, 'Review readiness refreshed.', 'Could not refresh readiness.')} onSubmit={() => run(mutations.submit, { confirmed: true }, 'Study submitted for review.', 'Submission blocked.')} onChanges={() => { const value = reason('Reason for requesting changes'); if (value) run(mutations.requestChanges, { reason: value }, 'Changes requested.', 'Could not request changes.'); }} onApprove={() => run(mutations.approve, { confirmed: true }, 'Study approved and locked.', 'Approval blocked.')} onReject={() => { const value = reason('Reason for rejection'); if (value) run(mutations.reject, { reason: value }, 'Study rejected.', 'Could not reject study.'); }} onReopen={() => { const value = reason('Reason for reopening'); if (value) run(mutations.reopen, { reason: value }, 'Study reopened as a controlled revision.', 'Could not reopen study.'); }} onWithdraw={() => { const value = reason('Reason for withdrawing review'); if (value) run(mutations.withdraw, { reason: value }, 'Review withdrawn.', 'Could not withdraw review.'); }} onReminder={() => run(mutations.sendReminders, undefined, 'Reminders sent to pending reviewers.', 'Could not send reminders.')} />
    {readOnly ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">This approved/closed LOPA study is read-only. Existing signatures and approval snapshots remain immutable; use controlled reopen to create a revision.</div> : null}
    <ReviewSummaryCards summary={data.summary} />
    <ReviewSignoffFilters filters={filters} setFilters={setFilters} />
    <ReviewSignoffBulkActions busy={busy} onRemind={() => run(mutations.sendReminders, undefined, 'Reminders sent.', 'Could not send reminders.')} onRefresh={() => run(mutations.refreshReadiness, undefined, 'Readiness refreshed.', 'Could not refresh readiness.')} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_.95fr]"><ReviewReadinessBlockersPanel readiness={data.readiness} busy={busy} onRefresh={() => run(mutations.refreshReadiness, undefined, 'Readiness refreshed.', 'Could not refresh readiness.')} /><SectionCompletionChecklist checks={data.checklist} onOpen={openRelated} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]"><ReviewWorkflowTimeline workflow={data.workflow} /><OpenBlockersRequiredActionsPanel rows={data.blockers} onAccept={(row) => { const value = reason('Reason for accepting this blocker exception'); if (value) run(mutations.acceptException, { blockerId: row.id, reason: value }, 'Blocker exception accepted and audited.', 'Could not accept exception.'); }} /></div>
    <ReviewerApproverRegister rows={filtered.participants} currentUserId={currentUserId} readOnly={readOnly} onAdd={() => setEditor({})} onEdit={(row) => setEditor(row)} onRemove={(row) => { const value = reason(`Reason for removing ${row.review_role}`); if (value) run(mutations.removeParticipant, { participantId: row.id, reason: value }, 'Review assignment removed.', 'Could not remove assignment.'); }} onDecision={(row) => { const decision = window.prompt('Decision: Approved, Approved with comments, Changes requested, Rejected, or Abstained', 'Approved'); if (!decision) return; const value = /Changes|Rejected/.test(decision) ? reason('Decision reason') : ''; run(mutations.decideParticipant, { participantId: row.id, input: { decision, ...(value ? { reason: value } : {}) } }, 'Review decision recorded.', 'Could not record review decision.'); }} onRequestSignature={(row) => run(mutations.requestSignature, row.id, 'Electronic signature requested.', 'Could not request signature.')} onSign={(row) => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); success(`Open the Universal E-Signature panel below to sign as ${row.review_role}.`); }} onRemind={(row) => run(mutations.remindParticipant, { participantId: row.id }, 'Reminder sent.', 'Could not send reminder.')} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><ReviewCommentsPanel rows={filtered.comments} context={data.context} readOnly={readOnly} onOpen={setComment} onAdd={(input) => run(mutations.addComment, input, 'Review comment created.', 'Could not add comment.')} onResolve={(row) => { const value = reason('Resolution notes'); if (value) run(mutations.resolveComment, { commentId: row.id, reason: value }, 'Review comment resolved.', 'Could not resolve comment.'); }} /><ESignaturePanel rows={data.signatures} participants={data.participants} currentUserId={currentUserId} context={data.context} signing={mutations.sign.isPending} onRequest={(row) => run(mutations.requestSignature, row.id, 'Signature request sent.', 'Could not request signature.')} onSign={(input) => run(mutations.sign, input, 'Electronic signature completed.', 'Signature failed. Check your active signature profile, assignment, and authentication.')} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><ApprovalDecisionPanel readOnly={readOnly} ready={data.summary.readyForApproval} busy={busy} onApprove={(input) => run(mutations.approve, input, 'Study approved and immutable snapshot created.', 'Approval blocked.')} onChanges={(input) => run(mutations.requestChanges, input, 'Changes requested.', 'Could not request changes.')} onReject={(input) => run(mutations.reject, input, 'Study rejected.', 'Could not reject study.')} /><ApprovalSnapshotPanel rows={data.snapshots} onOpen={(snapshot) => setMessage({ tone: 'success', text: `Approval snapshot v${snapshot.snapshot_version} is immutable. It was created ${snapshot.approved_at ? new Date(snapshot.approved_at).toLocaleString() : ''}.` })} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><ReopenRevisionControlPanel header={data.header} snapshots={data.snapshots} busy={busy} onReopen={(value) => run(mutations.reopen, { reason: value }, 'Study reopened as a revision.', 'Could not reopen study.')} /><NotificationsRemindersPanel rows={data.notifications} busy={mutations.sendReminders.isPending} onSend={() => run(mutations.sendReminders, undefined, 'Pending reviewers notified.', 'Could not send notifications.')} /></div>
    <AddEditReviewerDialog key={editor?.id ?? 'new'} open={editor !== null} initial={editor?.id ? { userId: editor.user_id, reviewRole: editor.review_role, discipline: editor.discipline, requiredReviewer: editor.required_reviewer, approver: editor.approver, signatureRequired: editor.signature_required, reviewSequence: editor.review_sequence, dueDate: editor.due_date ?? '' } : undefined} context={data.context} onClose={() => setEditor(null)} saving={mutations.addParticipant.isPending || mutations.updateParticipant.isPending} onSave={(input) => { if (editor?.id) run(mutations.updateParticipant, { participantId: editor.id, input }, 'Review assignment updated.', 'Could not update assignment.'); else run(mutations.addParticipant, input, 'Review assignment added.', 'Could not add reviewer.'); setEditor(null); }} />
    <CommentDetailDrawer comment={comment} onClose={() => setComment(null)} saving={mutations.updateComment.isPending || mutations.resolveComment.isPending} onSave={(input) => run(mutations.updateComment, { commentId: comment.id, input }, 'Review comment updated.', 'Could not update comment.')} onResolve={(value) => run(mutations.resolveComment, { commentId: comment.id, reason: value }, 'Review comment resolved.', 'Could not resolve comment.')} />
  </section>;
}
function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) { return <div className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>; }
function Toast({ tone, text, onClose }: { tone: 'success' | 'error'; text: string; onClose: () => void }) { return <div className={`fixed right-4 top-4 z-[100] flex max-w-md items-center gap-3 rounded-xl border p-3 text-sm shadow-xl ${tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50' : 'border-red-400/30 bg-red-500/15 text-red-50'}`}><span>{text}</span><button onClick={onClose} className="text-xs font-bold">Close</button></div>; }
function jwtSubject(token: string | null) { try { if (!token) return undefined; const payload = token.split('.')[1]; if (!payload) return undefined; return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).sub as string | undefined; } catch { return undefined; } }
