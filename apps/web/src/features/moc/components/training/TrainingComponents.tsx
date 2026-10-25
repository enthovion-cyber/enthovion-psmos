'use client';

import { CheckCircle2, Wand2 } from 'lucide-react';
import { Badge, DetailCard, EmptyState, Field, MocButton, detailInput, statusTone } from '../moc-detail-ui';

export function TrainingRequirementsPanel({ rows, draft, setDraft, onCreate, onGenerate }: any) {
  return (
    <DetailCard
      title="Training Requirements Panel"
      action={
        <MocButton variant="outline" onClick={onGenerate} icon={<Wand2 className="h-4 w-4" />}>
          Generate From Impact
        </MocButton>
      }
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Title">
          <input className={detailInput} value={draft.title ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, title: e.target.value }))} />
        </Field>
        <Field label="Training Type">
          <select className={detailInput} value={draft.trainingType ?? 'General awareness'} onChange={(e) => setDraft((v: any) => ({ ...v, trainingType: e.target.value }))}>
            {['SOP training','Operating limits training','Equipment change briefing','Safety system training','Emergency procedure training','Contractor briefing','Control room briefing','Maintenance procedure training','General awareness','Other'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Role">
          <input className={detailInput} value={draft.roleName ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, roleName: e.target.value }))} />
        </Field>
        <div className="flex items-end">
          <MocButton variant="primary" onClick={onCreate}>Create Requirement</MocButton>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {rows?.length ? (
          rows.map((row: any) => (
            <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <div className="flex justify-between gap-2">
                <p className="font-black text-[var(--psm-fg)]">{row.title ?? row.training_topic}</p>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{row.training_type} · {row.role_name} · before startup {row.required_before_startup ? 'yes' : 'no'}</p>
            </div>
          ))
        ) : (
          <EmptyState title="No training requirements generated yet." />
        )}
      </div>
    </DetailCard>
  );
}

export function TrainingCompletionTracker({ rows, onComplete, onVerify }: any) {
  return (
    <DetailCard title="Training Completion Tracker">
      {rows?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                {['Trainee','Role','Department','Status','Completed','Evidence','Verified','Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.map((row: any) => (
                <tr key={row.id} className="text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-3 py-3 font-semibold">{row.user_id ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.role_id ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.department_id ?? '-'}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.completed_at ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.evidence_attachment_id ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.verified_at ?? '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <MocButton variant="primary" onClick={() => onComplete(row.id)} icon={<CheckCircle2 className="h-4 w-4" />}>Complete</MocButton>
                      <MocButton variant="outline" onClick={() => onVerify(row.id)}>Verify</MocButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No training assignments yet." />
      )}
    </DetailCard>
  );
}
