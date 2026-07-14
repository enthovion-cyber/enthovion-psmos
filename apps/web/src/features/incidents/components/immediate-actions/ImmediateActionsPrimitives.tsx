import type { ReactNode } from 'react';
import { Field, InfoRows, SelectField, TabPanel, TextArea, ToggleGrid, formatDate } from '../shared/IncidentTabPrimitives';
import { ImmediateActionStatusBadge } from '../shared/ImmediateActionStatusBadge';
import { TemporaryControlBadge } from '../shared/TemporaryControlBadge';
import { VerificationStatusBadge } from '../shared/VerificationStatusBadge';

export const actionCategories = ['Emergency Response', 'Isolation / Shutdown / Permit', 'Spill / Release / Fire', 'First Aid / Medical', 'Temporary Control', 'Restart / Return-to-Service', 'Verification', 'Other'];
export const actionTypes = ['Area isolation', 'Equipment shutdown', 'Energy isolation', 'Spill containment', 'Fire response', 'First aid', 'Emergency response', 'Evacuation', 'Barricade/cordon', 'Permit suspension', 'Process stabilization', 'Temporary repair/control', 'Notification', 'Cleanup', 'Environmental containment', 'Security control', 'Other'];
export const actionStatuses = ['Draft', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Overdue', 'Cancelled', 'Superseded'];
export const temporaryControlTypes = ['Physical barrier', 'Temporary repair', 'Temporary operating limit', 'Manual monitoring', 'Temporary PPE requirement', 'Temporary procedure', 'Temporary isolation', 'Temporary bypass control', 'Other'];
export const triStateOptions = ['Yes', 'No', 'Not applicable'];

export function DrawerShell({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/60 p-2 sm:p-3"><div className="ml-auto flex h-full w-full max-w-5xl flex-col overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black">{title}</h2><button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-cyan-300/10">Close</button></div>{children}</div></div>;
}

export function ImmediateActionForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return <div className="grid gap-4">
    <FormSection title="Core action">
      <Field label="Action number" value={form.actionNumber} onChange={(value) => set('actionNumber', value)} />
      <SelectField label="Action type" value={form.actionType} options={actionTypes} onChange={(value) => set('actionType', value)} />
      <Field label="Title" value={form.title ?? form.actionLabel} onChange={(value) => { set('title', value); set('actionLabel', value); }} wide />
      <TextArea label="Description" value={form.description} onChange={(value) => set('description', value)} className="md:col-span-2" />
      <SelectField label="Category" value={form.category} options={actionCategories} onChange={(value) => set('category', value)} />
      <SelectField label="Status" value={form.status} options={actionStatuses} onChange={(value) => set('status', value)} />
      <SelectField label="Priority" value={form.priority} options={['Low', 'Medium', 'High', 'Critical']} onChange={(value) => set('priority', value)} />
      <Field label="Owner ID" value={form.ownerId} onChange={(value) => set('ownerId', value)} />
      <Field label="Due date/time" type="datetime-local" value={form.dueAt} onChange={(value) => set('dueAt', value)} />
      <Field label="Related hazard" value={form.relatedHazard} onChange={(value) => set('relatedHazard', value)} />
      <Field label="Related timeline event ID" value={form.relatedTimelineEventId} onChange={(value) => set('relatedTimelineEventId', value)} />
      <Field label="Related equipment ID" value={form.relatedEquipmentId} onChange={(value) => set('relatedEquipmentId', value)} />
      <Field label="Related chemical ID" value={form.relatedChemicalId} onChange={(value) => set('relatedChemicalId', value)} />
      <Field label="Related person ID" value={form.relatedPersonId} onChange={(value) => set('relatedPersonId', value)} />
    </FormSection>
    <FormSection title="Emergency response">
      <ToggleGrid form={form} set={set} keys={[['emergencyResponseActivated','Emergency response activated'], ['alarmRaised','Alarm raised'], ['evacuationInitiated','Evacuation initiated'], ['emergencyResponseTeamCalled','Emergency response team called'], ['fireBrigadeCalled','Fire brigade called'], ['ambulanceMedicalCalled','Ambulance/medical called'], ['externalAgencyCalled','External agency called']]} />
      <Field label="Emergency response start time" type="datetime-local" value={form.emergencyResponseStartTime} onChange={(value) => set('emergencyResponseStartTime', value)} />
      <Field label="Emergency response end time" type="datetime-local" value={form.emergencyResponseEndTime} onChange={(value) => set('emergencyResponseEndTime', value)} />
      <Field label="Response commander" value={form.responseCommander} onChange={(value) => set('responseCommander', value)} />
      <TextArea label="Response summary" value={form.responseSummary} onChange={(value) => set('responseSummary', value)} className="md:col-span-2" />
    </FormSection>
    <FormSection title="Isolation / shutdown / permit">
      <ToggleGrid form={form} set={set} keys={[['isolationShutdownPermit','Isolation/shutdown/permit control'], ['equipmentStopped','Equipment stopped'], ['equipmentIsolated','Equipment isolated'], ['energyIsolationCompleted','Energy isolation completed'], ['processShutdown','Process shutdown'], ['unitShutdown','Unit shutdown'], ['bypassActive','Bypass active'], ['permitSuspended','Permit suspended']]} />
      <SelectField label="Lockout/tagout applied" value={form.lockoutTagoutApplied} options={triStateOptions} onChange={(value) => set('lockoutTagoutApplied', value)} />
      <Field label="PTW number" value={form.ptwNumber} onChange={(value) => set('ptwNumber', value)} />
      <Field label="Isolation certificate/reference" value={form.isolationCertificateReference} onChange={(value) => set('isolationCertificateReference', value)} />
      <Field label="Isolation owner" value={form.isolationOwner} onChange={(value) => set('isolationOwner', value)} />
      <Field label="Isolation verified by" value={form.isolationVerifiedBy} onChange={(value) => set('isolationVerifiedBy', value)} />
      <Field label="Isolation verified at" type="datetime-local" value={form.isolationVerifiedAt} onChange={(value) => set('isolationVerifiedAt', value)} />
    </FormSection>
    <FormSection title="Spill / release / fire response">
      <ToggleGrid form={form} set={set} keys={[['spillReleaseFireResponse','Spill/release/fire response'], ['spillReleaseOccurred','Spill/release occurred'], ['spillReleaseContained','Spill/release contained'], ['releaseSourceIsolated','Release source isolated'], ['cleanupStarted','Cleanup started'], ['cleanupCompleted','Cleanup completed'], ['fireOccurred','Fire occurred'], ['fireExtinguished','Fire extinguished'], ['environmentalContainmentCompleted','Environmental containment completed'], ['wasteDisposalRequired','Waste disposal required'], ['environmentalSampleRequired','Environmental sample required']]} />
      <Field label="Fire response used" value={form.fireResponseUsed} onChange={(value) => set('fireResponseUsed', value)} />
      <Field label="Foam/water/agent used" value={form.extinguishingAgentUsed} onChange={(value) => set('extinguishingAgentUsed', value)} />
      <Field label="Waste generated" value={form.wasteGenerated} onChange={(value) => set('wasteGenerated', value)} />
    </FormSection>
    <FormSection title="First aid / medical response">
      <ToggleGrid form={form} set={set} keys={[['firstAidMedicalResponse','First aid/medical response'], ['firstAidProvided','First aid provided'], ['medicalTreatmentArranged','Medical treatment arranged'], ['decontaminationPerformed','Decontamination performed'], ['emergencyServicesCalled','Emergency services called'], ['transportedToMedical','Transported to clinic/hospital']]} />
      <Field label="First aid provider" value={form.firstAidProvider} onChange={(value) => set('firstAidProvider', value)} />
      <Field label="Medical response time" type="datetime-local" value={form.medicalResponseTime} onChange={(value) => set('medicalResponseTime', value)} />
      <Field label="Medical evidence ID" value={form.medicalEvidenceId} onChange={(value) => set('medicalEvidenceId', value)} />
      <TextArea label="Restricted medical notes" value={form.restrictedMedicalNotes} onChange={(value) => set('restrictedMedicalNotes', value)} className="md:col-span-2" />
    </FormSection>
    <FormSection title="Temporary controls and verification">
      <ToggleGrid form={form} set={set} keys={[['temporaryControlAdded','Temporary control added'], ['temporaryControl','Temporary control'], ['verificationRequired','Verification required'], ['evidenceRequired','Evidence required'], ['completed','Completed'], ['verified','Verified'], ['restartBlocker','Restart blocker'], ['capaRequired','CAPA required'], ['replacementPermanentActionRequired','Replacement permanent action required'], ['returnToServiceRequired','Return-to-service required'], ['reworkRequired','Rework required']]} />
      <SelectField label="Temporary control type" value={form.temporaryControlType} options={temporaryControlTypes} onChange={(value) => set('temporaryControlType', value)} />
      <Field label="Control owner" value={form.temporaryControlOwnerId} onChange={(value) => set('temporaryControlOwnerId', value)} />
      <Field label="Start date/time" type="datetime-local" value={form.temporaryControlStartAt} onChange={(value) => set('temporaryControlStartAt', value)} />
      <Field label="Expiry date/time" type="datetime-local" value={form.temporaryControlExpiryAt ?? form.temporaryControlExpiry} onChange={(value) => { set('temporaryControlExpiryAt', value); set('temporaryControlExpiry', value); }} />
      <Field label="Review frequency" value={form.reviewFrequency} onChange={(value) => set('reviewFrequency', value)} />
      <SelectField label="Verification status" value={form.verificationStatus} options={['Pending Verification', 'Verified', 'Rejected', 'Not Required']} onChange={(value) => set('verificationStatus', value)} />
      <Field label="Verification method" value={form.verificationMethod} onChange={(value) => set('verificationMethod', value)} />
      <Field label="Verification criteria" value={form.verificationCriteria} onChange={(value) => set('verificationCriteria', value)} />
      <Field label="Verification evidence" value={form.verificationEvidence} onChange={(value) => set('verificationEvidence', value)} />
      <Field label="Linked evidence ID" value={form.evidenceId} onChange={(value) => set('evidenceId', value)} />
      <Field label="Linked CAPA/action ID" value={form.linkedCapaActionId ?? form.capaActionId} onChange={(value) => { set('linkedCapaActionId', value); set('capaActionId', value); }} />
      <Field label="Failed verification reason" value={form.failedVerificationReason} onChange={(value) => set('failedVerificationReason', value)} />
      <TextArea label="Temporary control description" value={form.temporaryControlDescription} onChange={(value) => set('temporaryControlDescription', value)} className="md:col-span-2" />
      <TextArea label="Verification notes" value={form.verificationNotes} onChange={(value) => set('verificationNotes', value)} className="md:col-span-2" />
    </FormSection>
    <FormSection title="Notes and change reason">
      <TextArea label="Notes" value={form.notes} onChange={(value) => set('notes', value)} className="md:col-span-2" />
      <TextArea label="Change reason" value={form.changeReason} onChange={(value) => set('changeReason', value)} className="md:col-span-2" />
    </FormSection>
  </div>;
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <div className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10"><h3 className="text-xs font-black uppercase text-slate-500">{title}</h3><div className="grid gap-3 md:grid-cols-2">{children}</div></div>;
}

export function ActionCards({ rows, empty }: { rows?: any[] | undefined; empty: string }) {
  if (!rows?.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return <div className="grid gap-2">{rows.map((row) => <div key={row.id ?? row.action_key ?? row.action_label} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{row.action_number ? `${row.action_number} - ` : ''}{row.action_label ?? row.title}</span><ImmediateActionStatusBadge value={row.status ?? (row.completed ? 'Completed' : 'Open')} />{row.temporary_control || row.temporary_control_added ? <TemporaryControlBadge value /> : null}<VerificationStatusBadge value={row.verified ?? row.verification_status} /></div><p className="mt-1 text-slate-500">{row.description ?? row.notes}</p><div className="mt-1 text-[11px] text-slate-400">{row.owner_id ?? row.temporary_control_owner_id ?? 'No owner'} · Due {formatDate(row.due_at)} · Evidence {row.evidence_count ?? row.linked_evidence_ids?.length ?? 0}</div></div>)}</div>;
}

export function ActionInfoPanel({ title, rows, empty }: { title: string; rows?: any[] | undefined; empty: string }) {
  return <TabPanel title={title}><ActionCards rows={rows} empty={empty} /></TabPanel>;
}

export function ReviewBox({ review, onApprove, onReject }: any) {
  return <div className="grid gap-3"><InfoRows rows={[['Status', review?.status], ['Requested at', formatDate(review?.requestedAt)], ['Decision', review?.decision], ['Decided at', formatDate(review?.decidedAt)], ['Reason', review?.reason]]} /><div className="flex gap-2"><button onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button><button onClick={onReject} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-600">Reject</button></div></div>;
}
