'use client';

import { useState } from 'react';
import type { HazopSession } from '../../types/hazop-session.types';

export function HazopSessionActionPanel({ session, context, readonly, canCreate, onCreate, onSync }: { session: HazopSession; context?: any; readonly?: boolean | undefined; canCreate?: boolean | undefined; onCreate: (values: Record<string, any>) => void; onSync: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ priority: 'Medium', requiredBeforeSessionCompletion: false, evidenceRequired: false, verificationRequired: false });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="rounded-xl border border-[var(--psm-line)] p-4">
      <div className="mb-3 flex items-center justify-between"><h4 className="font-semibold">Session Follow-up Actions</h4><button onClick={onSync} className="text-xs text-primary">Sync Universal Actions</button></div>
      <div className="space-y-2">
        {(session.actionLinks ?? []).map((link: any) => (
          <div key={link.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{link.action?.actionNumber ?? link.linked_action_id} · {link.action?.title ?? 'Universal Action'}</div>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">Owner: {ownerName(context, link.action?.assignedToId)} · Due: {link.action?.dueDate ?? '-'} · Priority: {link.action?.priority ?? '-'}</div>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">Node: {link.node?.node_number ?? '-'} · Scenario: {link.scenario?.scenario_number ?? '-'} · Status: {link.action?.status ?? 'Linked'}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {link.required_before_session_completion ? <Badge text="Completion blocker" /> : null}
                {link.evidence_required ? <Badge text="Evidence" /> : null}
                {link.verification_required ? <Badge text="Verification" /> : null}
              </div>
            </div>
          </div>
        ))}
        {!(session.actionLinks ?? []).length ? <div className="text-sm text-[var(--psm-muted)]">No Universal Actions linked to this session.</div> : null}
      </div>
      {canCreate && !readonly ? <div className="mt-4 grid gap-2 md:grid-cols-2"><input className="input md:col-span-2" placeholder="Action title" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} /><select className="input" value={form.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value)}><option value="">Owner</option>{(context?.users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.displayName}</option>)}</select><input type="date" className="input" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value)} /><select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>{['Low', 'Medium', 'High', 'Critical'].map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={form.nodeId ?? ''} onChange={(e) => set('nodeId', e.target.value)}><option value="">Linked node</option>{(context?.nodes ?? []).map((node: any) => <option key={node.id} value={node.id}>{node.node_number} {node.title}</option>)}</select><select className="input" value={form.scenarioId ?? ''} onChange={(e) => set('scenarioId', e.target.value)}><option value="">Linked scenario</option>{(context?.scenarios ?? []).map((scenario: any) => <option key={scenario.id} value={scenario.id}>{scenario.scenario_number} {scenario.deviation_text}</option>)}</select><textarea className="input min-h-20 md:col-span-2" placeholder="Description" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.requiredBeforeSessionCompletion} onChange={(e) => set('requiredBeforeSessionCompletion', e.target.checked)} /> Required before session completion</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.evidenceRequired} onChange={(e) => set('evidenceRequired', e.target.checked)} /> Evidence required</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.verificationRequired} onChange={(e) => set('verificationRequired', e.target.checked)} /> Verification required</label><button onClick={() => onCreate(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2">Create Universal Action</button></div> : null}
    </section>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">{text}</span>;
}

function ownerName(context: any, id?: string | null) {
  return context?.users?.find((user: any) => user.id === id)?.displayName ?? id ?? '-';
}
