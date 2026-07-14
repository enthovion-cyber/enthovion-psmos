'use client';

import { useEffect, useState } from 'react';
import type { HazopSession } from '../../types/hazop-session.types';

export function HazopSessionMinutesPanel({ session, context, readonly, canManage, onSave, onApprove }: { session: HazopSession; context?: any; readonly?: boolean | undefined; canManage?: boolean | undefined; onSave: (values: Record<string, any>, minutesId?: string) => void; onApprove: (minutesId: string) => void }) {
  const minutes = session.minutes?.[0];
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    setForm({
      summary: minutes?.summary ?? '',
      discussionNotes: minutes?.discussion_notes ?? '',
      nodesReviewed: minutes?.nodes_reviewed ?? [],
      keyDeviationsDiscussed: minutes?.key_deviations_discussed ?? '',
      risksEscalated: minutes?.risks_escalated ?? '',
      recommendationsCreated: minutes?.recommendations_created ?? '',
      decisionsMade: minutes?.decisions_made ?? '',
      openQuestions: minutes?.open_questions ?? '',
      nextSessionPlan: minutes?.next_session_plan ?? '',
      reviewedBy: minutes?.reviewed_by ?? '',
      approvedBy: minutes?.approved_by ?? '',
      status: minutes?.status ?? 'Draft'
    });
  }, [minutes?.id, session.id]);
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const disabled = Boolean(readonly || !canManage);
  return (
    <section className="rounded-xl border border-[var(--psm-line)] p-4">
      <div className="mb-3 flex items-center justify-between"><h4 className="font-semibold">Meeting Minutes / Decisions Summary</h4><span className="text-xs text-[var(--psm-muted)]">{session.minutes_status}</span></div>
      <div className="grid gap-3">
        <textarea className="input min-h-20" placeholder="Session summary" value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} disabled={disabled} />
        <textarea className="input min-h-24" placeholder="Discussion notes" value={form.discussionNotes ?? ''} onChange={(e) => set('discussionNotes', e.target.value)} disabled={disabled} />
        <Field label="Nodes reviewed">
          <select multiple className="input min-h-24" value={form.nodesReviewed ?? []} onChange={(e) => set('nodesReviewed', Array.from(e.target.selectedOptions).map((option) => option.value))} disabled={disabled}>
            {(context?.nodes ?? session.plannedNodes ?? []).map((node: any) => <option key={node.id} value={node.id}>{node.node_number} - {node.title}</option>)}
          </select>
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea className="input min-h-20" placeholder="Key deviations discussed" value={form.keyDeviationsDiscussed ?? ''} onChange={(e) => set('keyDeviationsDiscussed', e.target.value)} disabled={disabled} />
          <textarea className="input min-h-20" placeholder="Risks escalated" value={form.risksEscalated ?? ''} onChange={(e) => set('risksEscalated', e.target.value)} disabled={disabled} />
          <textarea className="input min-h-20" placeholder="Recommendations created" value={form.recommendationsCreated ?? ''} onChange={(e) => set('recommendationsCreated', e.target.value)} disabled={disabled} />
          <textarea className="input min-h-20" placeholder="Decisions made" value={form.decisionsMade ?? ''} onChange={(e) => set('decisionsMade', e.target.value)} disabled={disabled} />
          <textarea className="input min-h-20" placeholder="Open questions" value={form.openQuestions ?? ''} onChange={(e) => set('openQuestions', e.target.value)} disabled={disabled} />
          <textarea className="input min-h-20" placeholder="Next session plan" value={form.nextSessionPlan ?? ''} onChange={(e) => set('nextSessionPlan', e.target.value)} disabled={disabled} />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Reviewed by"><UserSelect value={form.reviewedBy ?? ''} users={context?.users ?? []} onChange={(value) => set('reviewedBy', value)} disabled={disabled} /></Field>
          <Field label="Approved by"><UserSelect value={form.approvedBy ?? ''} users={context?.users ?? []} onChange={(value) => set('approvedBy', value)} disabled={disabled} /></Field>
          <Field label="Status"><select className="input" value={form.status ?? 'Draft'} onChange={(e) => set('status', e.target.value)} disabled={disabled}>{['Draft', 'Complete', 'Approved'].map((status) => <option key={status}>{status}</option>)}</select></Field>
        </div>
        <div className="text-xs text-[var(--psm-muted)]">Prepared by: {minutes?.preparedBy?.displayName ?? minutes?.prepared_by ?? 'Not saved yet'}</div>
      </div>
      {canManage && !readonly ? <div className="mt-3 flex gap-2"><button onClick={() => onSave(form, minutes?.id)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Save Minutes</button>{minutes?.id ? <button onClick={() => onApprove(minutes.id)} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm">Approve</button> : null}</div> : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1 text-sm"><span className="text-[var(--psm-muted)]">{label}</span>{children}</label>;
}

function UserSelect({ value, users, onChange, disabled }: { value: string; users: any[]; onChange: (value: string) => void; disabled?: boolean }) {
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}><option value="">Select user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName ?? user.email}</option>)}</select>;
}
