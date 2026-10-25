'use client';

import { Badge } from '../shared/IncidentStatusBadge';
import { Field, InfoRows, ReadinessContent, SelectField, SummaryCardGrid, TabPanel, TextArea, TimelineList, ToggleGrid, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { CapaPriorityBadge } from '../shared/CapaPriorityBadge';
import { CapaStatusBadge } from '../shared/CapaStatusBadge';
import { CapaTypeBadge } from '../shared/CapaTypeBadge';
import { EffectivenessBadge } from '../shared/EffectivenessBadge';
import { EscalationStatusBadge } from '../shared/EscalationStatusBadge';
import { ImplementationStatusBadge } from '../shared/ImplementationStatusBadge';
import { VerificationStatusBadge } from '../shared/VerificationStatusBadge';

export function CapaCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }

export function CapaSimplePanel({ title, data, empty = 'No backend records were returned for this panel.' }: { title: string; data: any; empty?: string }) {
  const rows = Array.isArray(data) ? data : data?.rows ?? [];
  return <TabPanel title={title}>
    <div className="grid gap-3">
      {data?.status ? <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Backend status</span><Badge value={data.status} /></div> : null}
      {data?.warning ? <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-200">{data.warning}</div> : null}
      <TimelineList rows={rows} empty={empty} columns />
    </div>
  </TabPanel>;
}

export function CapaRegisterTable({ rows, onEdit, onDelete, onComplete, onVerify, onReject, onEvidence, onSource, onEscalate, onLinkAction, onSpawnMoc, onSyncAction }: { rows: any[]; onEdit?: (row: any) => void; onDelete?: (row: any) => void; onComplete?: (row: any) => void; onVerify?: (row: any) => void; onReject?: (row: any) => void; onEvidence?: (row: any) => void; onSource?: (row: any) => void; onEscalate?: (row: any) => void; onLinkAction?: (row: any) => void; onSpawnMoc?: (row: any) => void; onSyncAction?: (row: any) => void }) {
  if (!rows?.length) return <p className="text-xs text-slate-500">No CAPA records exist yet. Generate from real RCA/barrier sources or add a CAPA linked to an existing Universal Action.</p>;
  return <div className="overflow-x-auto">
    <table className="min-w-[1500px] text-left text-xs">
      <thead className="text-[11px] uppercase text-slate-500">
        <tr>{['CAPA', 'Type / Category', 'Source', 'Priority', 'Risk Reduction', 'Owner / Due', 'Status', 'Implementation', 'Evidence', 'Verification', 'Escalation', 'Universal Action / MOC', 'Updated', 'Actions'].map((h) => <th key={h} className="p-2">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.id} className="border-t border-slate-200 align-top dark:border-cyan-300/10">
          <td className="p-2 font-bold"><div>{row.capa_number ?? '-'}</div><div>{row.action_title_snapshot}</div><p className="max-w-[260px] text-[11px] text-slate-500">{row.action_description}</p></td>
          <td className="p-2"><CapaTypeBadge value={row.action_type} /><div className="mt-1 text-slate-500">{row.action_category ?? '-'}</div></td>
          <td className="p-2">{row.source_type ?? '-'}<div className="text-slate-500">{row.source_id ?? '-'}</div></td>
          <td className="p-2"><CapaPriorityBadge value={row.priority} /></td>
          <td className="p-2"><div>{row.risk_reduction_objective ?? '-'}</div><div className="text-slate-500">{row.expected_outcome ?? '-'}</div></td>
          <td className="p-2">{row.owner_id ?? 'Owner missing'}<div className="text-slate-500">{row.due_date ?? 'Due date missing'}</div></td>
          <td className="p-2"><CapaStatusBadge value={row.status} /></td>
          <td className="p-2"><ImplementationStatusBadge value={row.implementation_status} /></td>
          <td className="p-2"><Badge value={row.evidence_status ?? (row.evidence_required ? 'Missing' : 'Not Required')} /></td>
          <td className="p-2"><VerificationStatusBadge value={row.verification_status} /><div className="mt-1"><EffectivenessBadge value={row.effectiveness_status} /></div></td>
          <td className="p-2"><EscalationStatusBadge value={row.escalation_status} /></td>
          <td className="p-2">
            <div className="flex flex-col gap-1.5 min-w-[130px]">
              {row.action_number_snapshot || row.universal_action_id ? (
                <div className="flex items-center gap-1">
                  <a
                    href={`/actions?id=${row.universal_action_id}`}
                    className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:underline dark:bg-blue-500/20 dark:text-blue-300"
                    title={`Universal Action ID: ${row.universal_action_id}`}
                  >
                    <span>🎯</span> {row.action_number_snapshot || (row.universal_action_id?.slice(0, 8) + '...')}
                  </a>
                  <button
                    onClick={() => onSyncAction?.(row)}
                    className="text-[10px] text-slate-400 hover:text-blue-500"
                    title="Resync to Universal Action Center"
                  >
                    ↻
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSyncAction?.(row)}
                  className="inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  ⚡ Sync Action
                </button>
              )}
              {row.moc_id || row.moc_number ? (
                <a
                  href={`/moc/${row.moc_id}`}
                  className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:underline dark:bg-indigo-500/20 dark:text-indigo-300"
                  title="View Management of Change Record"
                >
                  <span>🔀</span> {row.moc_number || 'MOC'}
                </a>
              ) : row.moc_required ? (
                <span className="inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  ⚠ MOC Required
                </span>
              ) : null}
            </div>
          </td>
          <td className="p-2">{formatDate(row.updated_at)}</td>
          <td className="p-2"><div className="flex min-w-[280px] flex-wrap gap-1">
            <button className={buttonSecondary} onClick={() => onEdit?.(row)}>Edit</button>
            <button className={buttonSecondary} onClick={() => onComplete?.(row)}>Complete</button>
            <button className={buttonSecondary} onClick={() => onVerify?.(row)}>Verify</button>
            <button className="rounded border border-indigo-400/40 bg-indigo-500/10 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 transition-colors" title="Spawn 1-Click MOC" onClick={() => onSpawnMoc?.(row)}>⚡ MOC</button>
            <button className="rounded border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-500/20 dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 transition-colors" title="Sync to Action Center" onClick={() => onSyncAction?.(row)}>Action</button>
            <button className={buttonSecondary} onClick={() => onReject?.(row)}>Reject</button>
            <button className={buttonSecondary} onClick={() => onEvidence?.(row)}>Evidence</button>
            <button className={buttonSecondary} onClick={() => onSource?.(row)}>Source</button>
            <button className={buttonSecondary} onClick={() => onEscalate?.(row)}>Escalate</button>
            <button className={buttonSecondary} onClick={() => onDelete?.(row)}>Cancel</button>
          </div></td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

export function CapaHeaderFacts({ header }: { header: any }) {
  return <InfoRows rows={[
    ['Incident', `${header?.incidentNumber ?? '-'} - ${header?.incidentTitle ?? '-'}`],
    ['Status / Priority', `${header?.incidentStatus ?? '-'} / ${header?.investigationPriority ?? '-'}`],
    ['RCA / CAPA required', `${header?.rcaStatus ?? '-'} / ${header?.capaRequired ? 'Yes' : 'No'}`],
    ['Open / Overdue / Verified', `${header?.openActions ?? 0} / ${header?.overdueActions ?? 0} / ${header?.verifiedActions ?? 0}`],
    ['Review', header?.reviewStatus],
    ['Last updated', formatDate(header?.lastUpdated)]
  ]} />;
}

export function CapaReadinessContent({ readiness }: { readiness: any }) { return <ReadinessContent readiness={readiness} />; }

export function CapaDrawerForm({ form, set, context }: { form: any; set: (key: string, value: any) => void; context?: any }) {
  const actionTypes = context?.actionTypes ?? ['Corrective Action', 'Preventive Action', 'Interim Action', 'Permanent Action', 'Verification Action', 'Other'];
  const sourceTypes = context?.sourceTypes ?? ['RCA Root Cause', 'Barrier Failure', 'Immediate Action', 'Other'];
  const statuses = context?.statuses ?? ['Draft', 'Assigned', 'In Progress', 'Completed', 'Verification Pending', 'Verified Effective', 'Rework Required', 'Escalated', 'Cancelled'];
  return <div className="grid gap-3 md:grid-cols-2">
    <Field label="Action title" value={form.actionTitle} onChange={(value) => set('actionTitle', value)} wide />
    <SelectField label="Action type" value={form.actionType} options={actionTypes} onChange={(value) => set('actionType', value)} />
    <Field label="Action category" value={form.actionCategory} onChange={(value) => set('actionCategory', value)} />
    <SelectField label="Source type" value={form.sourceType} options={sourceTypes} onChange={(value) => set('sourceType', value)} />
    <Field label="Linked source record ID" value={form.sourceId} onChange={(value) => set('sourceId', value)} />
    <Field label="Linked RCA root cause ID" value={form.linkedRcaRootCauseId} onChange={(value) => set('linkedRcaRootCauseId', value)} />
    <Field label="Linked causal factor ID" value={form.linkedCausalFactorId} onChange={(value) => set('linkedCausalFactorId', value)} />
    <Field label="Linked barrier failure ID" value={form.linkedBarrierFailureId} onChange={(value) => set('linkedBarrierFailureId', value)} />
    <Field label="Linked immediate action ID" value={form.linkedImmediateActionId} onChange={(value) => set('linkedImmediateActionId', value)} />
    <Field label="Linked evidence gap / regulatory finding" value={form.sourceTitleSnapshot} onChange={(value) => set('sourceTitleSnapshot', value)} />
    <Field label="Risk reduction objective" value={form.riskReductionObjective} onChange={(value) => set('riskReductionObjective', value)} wide />
    <Field label="Expected outcome" value={form.expectedOutcome} onChange={(value) => set('expectedOutcome', value)} wide />
    <Field label="Owner user ID" value={form.ownerId} onChange={(value) => set('ownerId', value)} />
    <Field label="Supporting team IDs" value={form.supportingTeamIdsText} onChange={(value) => set('supportingTeamIdsText', value)} />
    <Field label="Due date" type="date" value={form.dueDate} onChange={(value) => set('dueDate', value)} />
    <SelectField label="Priority" value={form.priority} options={context?.priorities ?? ['Low', 'Medium', 'High', 'Critical']} onChange={(value) => set('priority', value)} />
    <SelectField label="Status" value={form.status} options={statuses} onChange={(value) => set('status', value)} />
    <Field label="Verification method" value={form.verificationMethod} onChange={(value) => set('verificationMethod', value)} />
    <Field label="Verification due date" type="date" value={form.verificationDueDate} onChange={(value) => set('verificationDueDate', value)} />
    <Field label="Linked evidence IDs" value={form.evidenceIdsText} onChange={(value) => set('evidenceIdsText', value)} />
    <Field label="Universal Action ID" value={form.universalActionId} onChange={(value) => set('universalActionId', value)} />
    <TextArea className="md:col-span-2" label="Description" value={form.description} onChange={(value) => set('description', value)} />
    <TextArea className="md:col-span-2" label="Implementation plan" value={form.implementationPlan} onChange={(value) => set('implementationPlan', value)} />
    <TextArea className="md:col-span-2" label="Notes / change reason" value={form.notes ?? form.changeReason} onChange={(value) => { set('notes', value); set('changeReason', value); }} />
    <div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[
      ['verificationRequired', 'Verification required'], ['evidenceRequired', 'Evidence required'], ['mocRequired', 'MOC required'], ['pssrRequired', 'PSSR required'], ['ptwRequired', 'PTW required'], ['miRequired', 'MI signoff required'], ['regulatoryRequired', 'Regulatory action']
    ]} /></div>
  </div>;
}
