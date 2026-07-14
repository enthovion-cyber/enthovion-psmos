'use client';

import { useState } from 'react';
import { AddEditImmediateActionDrawer } from '../immediate-actions/AddEditImmediateActionDrawer';
import { ConvertToCapaPanel } from '../immediate-actions/ConvertToCapaPanel';
import { EmergencyResponseActionsPanel } from '../immediate-actions/EmergencyResponseActionsPanel';
import { FirstAidMedicalImmediateResponsePanel } from '../immediate-actions/FirstAidMedicalImmediateResponsePanel';
import { ImmediateActionVerificationPanel } from '../immediate-actions/ImmediateActionVerificationPanel';
import { ImmediateActionsChangeHistoryPanel } from '../immediate-actions/ImmediateActionsChangeHistoryPanel';
import { ImmediateActionsHeader } from '../immediate-actions/ImmediateActionsHeader';
import { ImmediateActionsReadinessPanel } from '../immediate-actions/ImmediateActionsReadinessPanel';
import { ImmediateActionsRegister } from '../immediate-actions/ImmediateActionsRegister';
import { ImmediateActionsReviewPanel } from '../immediate-actions/ImmediateActionsReviewPanel';
import { ImmediateActionsSummaryCards } from '../immediate-actions/ImmediateActionsSummaryCards';
import { IsolationShutdownPermitControlPanel } from '../immediate-actions/IsolationShutdownPermitControlPanel';
import { RestartReturnToServicePanel } from '../immediate-actions/RestartReturnToServicePanel';
import { SiteSafetyStatusPanel } from '../immediate-actions/SiteSafetyStatusPanel';
import { SpillReleaseFireResponsePanel } from '../immediate-actions/SpillReleaseFireResponsePanel';
import { TemporaryControlsPanel } from '../immediate-actions/TemporaryControlsPanel';
import { TabStatePanel, errorText, toLocalInput } from '../shared/IncidentTabPrimitives';
import { useIncidentImmediateActions, useIncidentImmediateActionsMutations } from '../../hooks/useIncidentImmediateActions';

export function ImmediateActionsTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentImmediateActions(incidentId);
  const mutations = useIncidentImmediateActionsMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);
  if (isLoading) return <TabStatePanel title="Loading Immediate Actions" message="Loading real site safety, restart controls, temporary controls, CAPA conversion, review, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Immediate Actions" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Immediate Actions data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this tab.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({ status: 'Draft', priority: 'Medium', verificationStatus: 'Pending Verification' }); setDrawerOpen(true); };
  const view = (row: any) => { setForm(fromActionRow(row)); setDrawerOpen(true); };
  const edit = (row: any) => { setForm(fromActionRow(row)); setDrawerOpen(true); };
  const save = async () => {
    try { if (form.id) await mutations.update.mutateAsync({ actionId: form.id, values: form }); else await mutations.create.mutateAsync(form); setDrawerOpen(false); setMessage('Immediate action saved.'); } catch (event) { setMessage(errorText(event)); }
  };
  const remove = async (actionId: string) => { if (!window.confirm('Delete this immediate action?')) return; try { await mutations.remove.mutateAsync(actionId); setMessage('Immediate action deleted.'); } catch (event) { setMessage(errorText(event)); } };
  const convert = async (actionId: string) => { try { await mutations.convertCapa.mutateAsync({ actionId, values: { reason: 'Converted from Immediate Actions tab' } }); setMessage('CAPA conversion requested through Universal Action Engine linkage.'); } catch (event) { setMessage(errorText(event)); } };
  const complete = async (actionId: string) => { try { await mutations.complete.mutateAsync({ actionId, values: { reason: 'Marked complete from Immediate Actions tab' } }); setMessage('Immediate action marked complete.'); } catch (event) { setMessage(errorText(event)); } };
  const verify = async (actionId: string) => { const comment = window.prompt('Verification comment'); if (!comment) return; try { await mutations.verify.mutateAsync({ actionId, values: { comment } }); setMessage('Immediate action verified.'); } catch (event) { setMessage(errorText(event)); } };
  const rejectVerification = async (actionId: string) => { const reason = window.prompt('Reason for rejecting verification'); if (!reason) return; try { await mutations.rejectVerification.mutateAsync({ actionId, values: { reason } }); setMessage('Verification rejected and rework marked.'); } catch (event) { setMessage(errorText(event)); } };
  const linkEvidence = async (actionId?: string) => { const evidenceId = window.prompt('Evidence ID to link'); if (!evidenceId) return; try { const target = actionId ?? data.actionsRegister?.[0]?.id; if (!target) throw new Error('No immediate action selected for evidence link.'); await mutations.linkEvidence.mutateAsync({ actionId: target, values: { evidenceId, reason: 'Evidence linked from Immediate Actions tab' } }); setMessage('Evidence linked.'); } catch (event) { setMessage(errorText(event)); } };
  const linkCapa = async (actionId: string) => { const actionRecordId = window.prompt('Existing CAPA/action ID'); if (!actionRecordId) return; try { await mutations.linkCapa.mutateAsync({ actionId, values: { actionId: actionRecordId, reason: 'Existing CAPA/action linked from Immediate Actions tab' } }); setMessage('CAPA/action linked.'); } catch (event) { setMessage(errorText(event)); } };
  const cancel = async (actionId: string) => { const reason = window.prompt('Reason to cancel/supersede this immediate action'); if (!reason) return; try { await mutations.cancel.mutateAsync({ actionId, values: { reason } }); setMessage('Immediate action cancelled/superseded.'); } catch (event) { setMessage(errorText(event)); } };
  const createFollowup = async (actionId?: string) => { try { const target = actionId ?? data.actionsRegister?.find((row: any) => row.capa_required || row.restart_blocker || row.temporary_control)?.id ?? data.actionsRegister?.[0]?.id; if (!target) throw new Error('No immediate action selected for follow-up action.'); await mutations.createFollowup.mutateAsync({ actionId: target, values: { reason: 'Follow-up action created from Immediate Actions tab' } }); setMessage('Follow-up action created through Universal Action Engine linkage.'); } catch (event) { setMessage(errorText(event)); } };
  const verifySiteSafe = async () => {
    const areaSafeNow = window.confirm('Mark area safe now? Choose Cancel to save as No/unsafe.') ? 'Yes' : 'No';
    const notes = window.prompt('Site safety notes or evidence reference') ?? '';
    try { await mutations.updateSiteSafety.mutateAsync({ areaSafeNow, unsafeConditionRemains: areaSafeNow !== 'Yes', restartBlocked: data.header?.restartBlocked, verificationEvidence: notes, notes, reason: 'Site safety verified from Immediate Actions tab' }); setMessage('Site safety status saved.'); } catch (event) { setMessage(errorText(event)); }
  };
  const saveChanges = async () => {
    const reason = window.prompt('Save site safety/restart note or change reason') ?? 'Immediate Actions changes saved';
    try {
      await mutations.updateSiteSafety.mutateAsync({ areaSafeNow: data.siteSafetyStatus?.areaSafeNow ?? 'Unknown', unsafeConditionRemains: data.siteSafetyStatus?.unsafeConditionRemains, restartBlocked: data.header?.restartBlocked, notes: reason, reason });
      setMessage('Immediate Actions changes saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const requestReview = async () => { try { await mutations.requestReview.mutateAsync({ reason: 'Immediate Actions review requested' }); setMessage('Review requested.'); } catch (event) { setMessage(errorText(event)); } };
  const approve = async () => { try { await mutations.approveReview.mutateAsync({ reason: 'Immediate Actions approved' }); setMessage('Review approved.'); } catch (event) { setMessage(errorText(event)); } };
  const reject = async () => { const reason = window.prompt('Reason for rejection'); if (!reason) return; try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Review rejected.'); } catch (event) { setMessage(errorText(event)); } };

  return <div className="grid gap-4">
    <ImmediateActionsHeader data={data} saving={saving} message={message} onAdd={add} onVerifySiteSafe={verifySiteSafe} onLinkEvidence={() => linkEvidence()} onConvertCapa={() => createFollowup()} onRequestReview={requestReview} onCreateAction={() => createFollowup()} onSaveChanges={saveChanges} onRefresh={() => refetch()} />
    <ImmediateActionsSummaryCards cards={data.summaryCards ?? []} charts={data.charts} />
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><ImmediateActionsRegister rows={data.actionsRegister ?? []} onView={view} onEdit={edit} onComplete={complete} onVerify={verify} onRejectVerification={rejectVerification} onLinkEvidence={linkEvidence} onDelete={remove} onConvert={convert} onLinkCapa={linkCapa} onCancel={cancel} onCreateFollowup={createFollowup} canDelete={data.permissions?.canDelete} /><ImmediateActionsReadinessPanel readiness={data.readiness} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><SiteSafetyStatusPanel data={data.siteSafetyStatus} /><TemporaryControlsPanel data={data.temporaryControls} /><RestartReturnToServicePanel data={data.restartReturnToService} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><EmergencyResponseActionsPanel data={data.emergencyResponseActions} /><IsolationShutdownPermitControlPanel data={data.isolationShutdownPermitControl} /><SpillReleaseFireResponsePanel data={data.spillReleaseFireResponse} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><FirstAidMedicalImmediateResponsePanel data={data.firstAidMedicalImmediateResponse} /><ImmediateActionVerificationPanel data={data.verification} /><ConvertToCapaPanel data={data.convertToCapa} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><ImmediateActionsReviewPanel review={data.review} onApprove={approve} onReject={reject} /><ImmediateActionsChangeHistoryPanel rows={data.changeHistory ?? []} /></div>
    <AddEditImmediateActionDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={save} />
  </div>;
}

function fromActionRow(row: any) {
  return {
    id: row.id,
    actionNumber: row.action_number,
    actionKey: row.action_key,
    title: row.title ?? row.action_label,
    actionLabel: row.action_label ?? row.title,
    description: row.description,
    actionType: row.action_type,
    category: row.category,
    status: row.status,
    priority: row.priority,
    ownerId: row.owner_id,
    dueAt: toLocalInput(row.due_at),
    relatedHazard: row.related_hazard,
    relatedTimelineEventId: row.related_timeline_event_id,
    relatedEquipmentId: row.related_equipment_id,
    relatedChemicalId: row.related_chemical_id,
    relatedPersonId: row.related_person_id,
    completed: !!row.completed,
    temporaryControl: !!row.temporary_control,
    temporaryControlAdded: !!row.temporary_control_added,
    temporaryControlType: row.temporary_control_type,
    temporaryControlDescription: row.temporary_control_description,
    temporaryControlOwnerId: row.temporary_control_owner_id,
    temporaryControlStartAt: toLocalInput(row.temporary_control_start_at),
    temporaryControlExpiry: row.temporary_control_expiry,
    temporaryControlExpiryAt: toLocalInput(row.temporary_control_expiry_at),
    reviewFrequency: row.review_frequency,
    verified: !!row.verified,
    verificationRequired: !!row.verification_required,
    verificationStatus: row.verification_status,
    verificationMethod: row.verification_method,
    verificationCriteria: row.verification_criteria,
    verificationEvidence: row.verification_evidence,
    verificationNotes: row.verification_notes,
    failedVerificationReason: row.failed_verification_reason,
    evidenceRequired: !!row.evidence_required,
    evidenceId: row.evidence_id,
    linkedEvidenceIds: row.linked_evidence_ids,
    reworkRequired: !!row.rework_required,
    restartBlocker: !!row.restart_blocker,
    capaRequired: !!row.capa_required,
    capaActionId: row.capa_action_id,
    linkedCapaActionId: row.linked_capa_action_id,
    capaConversionStatus: row.capa_conversion_status,
    replacementPermanentActionRequired: !!row.replacement_permanent_action_required,
    emergencyResponse: !!row.emergency_response,
    emergencyResponseActivated: !!row.emergency_response_activated,
    alarmRaised: !!row.alarm_raised,
    evacuationInitiated: !!row.evacuation_initiated,
    emergencyResponseTeamCalled: !!row.emergency_response_team_called,
    fireBrigadeCalled: !!row.fire_brigade_called,
    ambulanceMedicalCalled: !!row.ambulance_medical_called,
    externalAgencyCalled: !!row.external_agency_called,
    emergencyResponseStartTime: toLocalInput(row.emergency_response_start_time),
    emergencyResponseEndTime: toLocalInput(row.emergency_response_end_time),
    responseCommander: row.response_commander,
    responseSummary: row.response_summary,
    isolationShutdownPermit: !!row.isolation_shutdown_permit,
    equipmentStopped: !!row.equipment_stopped,
    equipmentIsolated: !!row.equipment_isolated,
    energyIsolationCompleted: !!row.energy_isolation_completed,
    lockoutTagoutApplied: row.lockout_tagout_applied,
    processShutdown: !!row.process_shutdown,
    unitShutdown: !!row.unit_shutdown,
    bypassActive: !!row.bypass_active,
    permitSuspended: !!row.permit_suspended,
    ptwNumber: row.ptw_number,
    isolationCertificateReference: row.isolation_certificate_reference,
    isolationOwner: row.isolation_owner,
    isolationVerifiedBy: row.isolation_verified_by,
    isolationVerifiedAt: toLocalInput(row.isolation_verified_at),
    spillReleaseFireResponse: !!row.spill_release_fire_response,
    spillReleaseOccurred: !!row.spill_release_occurred,
    spillReleaseContained: !!row.spill_release_contained,
    releaseSourceIsolated: !!row.release_source_isolated,
    cleanupStarted: !!row.cleanup_started,
    cleanupCompleted: !!row.cleanup_completed,
    fireOccurred: !!row.fire_occurred,
    fireExtinguished: !!row.fire_extinguished,
    fireResponseUsed: row.fire_response_used,
    extinguishingAgentUsed: row.extinguishing_agent_used,
    environmentalContainmentCompleted: !!row.environmental_containment_completed,
    wasteGenerated: row.waste_generated,
    wasteDisposalRequired: !!row.waste_disposal_required,
    environmentalSampleRequired: !!row.environmental_sample_required,
    firstAidMedicalResponse: !!row.first_aid_medical_response,
    firstAidProvided: !!row.first_aid_provided,
    firstAidProvider: row.first_aid_provider,
    medicalTreatmentArranged: !!row.medical_treatment_arranged,
    decontaminationPerformed: !!row.decontamination_performed,
    emergencyServicesCalled: !!row.emergency_services_called,
    transportedToMedical: !!row.transported_to_medical,
    medicalResponseTime: toLocalInput(row.medical_response_time),
    medicalEvidenceId: row.medical_evidence_id,
    restrictedMedicalNotes: row.restricted_medical_notes,
    returnToServiceRequired: !!row.return_to_service_required,
    notes: row.notes,
    changeReason: row.change_reason
  };
}
