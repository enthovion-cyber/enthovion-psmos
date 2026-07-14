'use client';

import { useState } from 'react';
import { useIncidentCapa, useIncidentCapaMutations } from '../../hooks/useIncidentCapa';
import { ActionClassificationPriorityPanel } from '../corrective-preventive-actions/ActionClassificationPriorityPanel';
import { AddEditCapaDrawer } from '../corrective-preventive-actions/AddEditCapaDrawer';
import { CapaChangeHistoryPanel } from '../corrective-preventive-actions/CapaChangeHistoryPanel';
import { CapaCoverageMatrixPanel } from '../corrective-preventive-actions/CapaCoverageMatrixPanel';
import { CapaHeader } from '../corrective-preventive-actions/CapaHeader';
import { CapaReadinessPanel } from '../corrective-preventive-actions/CapaReadinessPanel';
import { CapaRegister } from '../corrective-preventive-actions/CapaRegister';
import { CapaReviewPanel } from '../corrective-preventive-actions/CapaReviewPanel';
import { CapaSourceReadinessPanel } from '../corrective-preventive-actions/CapaSourceReadinessPanel';
import { CapaSummaryCards } from '../corrective-preventive-actions/CapaSummaryCards';
import { EffectivenessVerificationPanel } from '../corrective-preventive-actions/EffectivenessVerificationPanel';
import { EvidenceOfCompletionPanel } from '../corrective-preventive-actions/EvidenceOfCompletionPanel';
import { ImplementationPlanPanel } from '../corrective-preventive-actions/ImplementationPlanPanel';
import { OverdueEscalationPanel } from '../corrective-preventive-actions/OverdueEscalationPanel';
import { OwnerDueDateAssignmentPanel } from '../corrective-preventive-actions/OwnerDueDateAssignmentPanel';
import { SourceMappingPanel } from '../corrective-preventive-actions/SourceMappingPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';

export function CorrectivePreventiveActionsTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentCapa(incidentId);
  const mutations = useIncidentCapaMutations(incidentId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Corrective / Preventive Actions" message="Loading CAPA register, source mapping, Universal Action links, evidence, verification, escalation, review, history, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Corrective / Preventive Actions" message={error instanceof Error ? error.message : 'The CAPA API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No CAPA data" message="No Corrective / Preventive Actions data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view CAPA.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({ actionType: 'Corrective Action', priority: 'Medium', status: 'Draft', verificationRequired: true, evidenceRequired: true }); setOpen(true); };
  const edit = (row: any) => { setForm(fromCapa(row)); setOpen(true); };
  const save = async () => {
    try {
      const values = normalizeCapa(form);
      if (form.id) await mutations.update.mutateAsync({ capaId: form.id, values });
      else await mutations.create.mutateAsync(values);
      setOpen(false);
      setMessage('CAPA saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const cancel = async (row: any) => { const reason = window.prompt('Reason for cancelling or superseding this CAPA'); if (!reason) return; try { await mutations.delete.mutateAsync({ capaId: row.id, values: { reason } }); setMessage('CAPA cancelled/superseded.'); } catch (event) { setMessage(errorText(event)); } };
  const complete = async (row: any) => { try { await mutations.submitCompletion.mutateAsync({ capaId: row.id, values: { reason: 'Completion submitted from CAPA tab' } }); setMessage('CAPA completion submitted.'); } catch (event) { setMessage(errorText(event)); } };
  const verify = async (row: any) => { const result = window.prompt('Verification result / effectiveness statement') ?? 'Verified effective from CAPA tab'; try { await mutations.verifyEffectiveness.mutateAsync({ capaId: row.id, values: { verificationMethod: row.verification_method ?? 'Document review', verificationResult: result, effective: true } }); setMessage('CAPA verified effective.'); } catch (event) { setMessage(errorText(event)); } };
  const reject = async (row: any) => { const reason = window.prompt('Reason evidence/verification is rejected'); if (!reason) return; try { await mutations.rejectEvidence.mutateAsync({ capaId: row.id, values: { reason } }); setMessage('CAPA evidence rejected and rework required.'); } catch (event) { setMessage(errorText(event)); } };
  const linkEvidence = async (row: any) => { const evidenceId = window.prompt('Evidence ID to link'); if (!evidenceId) return; try { await mutations.linkEvidence.mutateAsync({ capaId: row.id, values: { evidenceId } }); setMessage('Evidence linked to CAPA.'); } catch (event) { setMessage(errorText(event)); } };
  const linkSource = async (row: any) => { const sourceType = window.prompt('Source type, e.g. RCA Root Cause or Barrier Failure', row.source_type ?? 'RCA Root Cause'); const sourceId = window.prompt('Source record ID'); if (!sourceType || !sourceId) return; try { await mutations.linkSource.mutateAsync({ capaId: row.id, values: { sourceType, sourceId, sourceTitleSnapshot: row.action_title_snapshot } }); setMessage('CAPA source linked.'); } catch (event) { setMessage(errorText(event)); } };
  const escalate = async (row: any) => { const reason = window.prompt('Escalation reason'); if (!reason) return; try { await mutations.escalate.mutateAsync({ capaId: row.id, values: { reason, escalationStatus: 'Escalated' } }); setMessage('CAPA escalated.'); } catch (event) { setMessage(errorText(event)); } };
  const linkAction = async (row?: any) => { const target = row ?? data.capaRegister?.[0]; if (!target) { setMessage('No CAPA item selected for Universal Action linking.'); return; } const universalActionId = window.prompt('Existing Universal Action ID'); if (!universalActionId) return; try { await mutations.linkExistingAction.mutateAsync({ capaId: target.id, values: { universalActionId } }); setMessage('Existing Universal Action linked.'); } catch (event) { setMessage(errorText(event)); } };
  const requestReview = async () => { try { await mutations.requestReview.mutateAsync({ reason: 'CAPA review requested from tab' }); setMessage('CAPA review requested.'); } catch (event) { setMessage(errorText(event)); } };
  const approveReview = async () => { try { await mutations.approveReview.mutateAsync({ comments: 'CAPA review approved from tab' }); setMessage('CAPA review approved.'); } catch (event) { setMessage(errorText(event)); } };
  const rejectReview = async () => { const reason = window.prompt('Reason for rejecting CAPA review'); if (!reason) return; try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('CAPA review rejected.'); } catch (event) { setMessage(errorText(event)); } };

  return <div className="grid gap-4">
    <CapaHeader data={data} saving={saving} message={message} onAdd={add} onGenerateRca={() => mutations.generateFromRca.mutateAsync({ reason: 'Generated from CAPA tab' }).then(() => setMessage('CAPA generated from RCA root causes.')).catch((event) => setMessage(errorText(event)))} onGenerateBarriers={() => mutations.generateFromBarriers.mutateAsync({ reason: 'Generated from CAPA tab' }).then(() => setMessage('CAPA generated from barrier failures.')).catch((event) => setMessage(errorText(event)))} onLinkExisting={() => linkAction()} onRequestReview={requestReview} onExport={() => mutations.export.mutateAsync().then(() => setMessage('CAPA register export generated.')).catch((event) => setMessage(errorText(event)))} onSaveChanges={() => setMessage('Open a CAPA row to save detailed changes.')} onRefresh={() => refetch()} />
    <CapaSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><CapaRegister rows={data.capaRegister ?? []} onEdit={edit} onDelete={cancel} onComplete={complete} onVerify={verify} onReject={reject} onEvidence={linkEvidence} onSource={linkSource} onEscalate={escalate} onLinkAction={linkAction} /><CapaSourceReadinessPanel data={data.sourceReadiness} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><SourceMappingPanel data={data.sourceMapping} /><ActionClassificationPriorityPanel data={data.classificationPriority} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><OwnerDueDateAssignmentPanel data={data.ownerDueDateAssignment} /><ImplementationPlanPanel data={data.implementationPlan} /><EvidenceOfCompletionPanel data={data.evidenceOfCompletion} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><EffectivenessVerificationPanel data={data.effectivenessVerification} /><OverdueEscalationPanel data={data.overdueEscalation} /><CapaCoverageMatrixPanel data={data.coverageMatrix} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><CapaReviewPanel review={data.review} onRequest={requestReview} onApprove={approveReview} onReject={rejectReview} /><CapaReadinessPanel readiness={data.readiness} /></div>
    <CapaChangeHistoryPanel rows={data.changeHistory ?? []} />
    <AddEditCapaDrawer open={open} form={form} set={set} context={data.context} saving={saving} onClose={() => setOpen(false)} onSave={save} />
  </div>;
}

function fromCapa(row: any) {
  return {
    id: row.id, actionTitle: row.action_title_snapshot, description: row.action_description, actionType: row.action_type, actionCategory: row.action_category, sourceType: row.source_type, sourceId: row.source_id, sourceTitleSnapshot: row.source_title_snapshot, priority: row.priority, riskReductionObjective: row.risk_reduction_objective, expectedOutcome: row.expected_outcome, ownerId: row.owner_id, supportingTeamIdsText: (row.supporting_team_ids_json ?? []).join(', '), dueDate: row.due_date, status: row.status, implementationStatus: row.implementation_status, implementationPlan: row.implementation_plan, evidenceRequired: row.evidence_required, evidenceIdsText: (row.evidence_ids_json ?? []).join(', '), verificationRequired: row.verification_required, verificationMethod: row.verification_method, verificationDueDate: row.verification_due_date, verificationStatus: row.verification_status, universalActionId: row.universal_action_id, mocRequired: row.moc_required, pssrRequired: row.pssr_required, ptwRequired: row.ptw_required, miRequired: row.mi_required, regulatoryRequired: row.regulatory_required, notes: row.notes
  };
}

function normalizeCapa(form: Record<string, any>) {
  return { ...form, supportingTeamIds: splitIds(form.supportingTeamIdsText), evidenceIds: splitIds(form.evidenceIdsText), actionTitle: form.actionTitle, actionType: form.actionType ?? 'Corrective Action', priority: form.priority ?? 'Medium', status: form.status ?? 'Draft', verificationRequired: form.verificationRequired !== false, evidenceRequired: form.evidenceRequired !== false };
}

function splitIds(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}
