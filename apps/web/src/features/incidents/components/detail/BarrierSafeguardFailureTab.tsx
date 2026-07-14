'use client';

import { useState } from 'react';
import { useIncidentBarriers, useIncidentBarrierMutations } from '../../hooks/useIncidentBarriers';
import { AddEditBarrierDrawer } from '../barrier-safeguard-failure/AddEditBarrierDrawer';
import { AdministrativeProcedurePtwPanel } from '../barrier-safeguard-failure/AdministrativeProcedurePtwPanel';
import { AlarmOperatorResponsePanel } from '../barrier-safeguard-failure/AlarmOperatorResponsePanel';
import { BarrierAnalysisReadinessPanel } from '../barrier-safeguard-failure/BarrierAnalysisReadinessPanel';
import { BarrierChangeHistoryPanel } from '../barrier-safeguard-failure/BarrierChangeHistoryPanel';
import { BarrierDemandPerformancePanel } from '../barrier-safeguard-failure/BarrierDemandPerformancePanel';
import { BarrierReadinessPanel } from '../barrier-safeguard-failure/BarrierReadinessPanel';
import { BarrierReviewPanel } from '../barrier-safeguard-failure/BarrierReviewPanel';
import { BarrierSafeguardHeader } from '../barrier-safeguard-failure/BarrierSafeguardHeader';
import { BarrierSafeguardRegister } from '../barrier-safeguard-failure/BarrierSafeguardRegister';
import { BarrierSummaryCards } from '../barrier-safeguard-failure/BarrierSummaryCards';
import { BowtieBarrierMapPanel } from '../barrier-safeguard-failure/BowtieBarrierMapPanel';
import { EvidenceMappedBarrierPanel } from '../barrier-safeguard-failure/EvidenceMappedBarrierPanel';
import { FailureModeAnalysisPanel } from '../barrier-safeguard-failure/FailureModeAnalysisPanel';
import { FollowupRequirementsPanel } from '../barrier-safeguard-failure/FollowupRequirementsPanel';
import { IplLopaCreditCheckPanel } from '../barrier-safeguard-failure/IplLopaCreditCheckPanel';
import { PpeEmergencyResponseBarrierPanel } from '../barrier-safeguard-failure/PpeEmergencyResponseBarrierPanel';
import { PsvReliefDevicePanel } from '../barrier-safeguard-failure/PsvReliefDevicePanel';
import { RcaLinkagePanel } from '../barrier-safeguard-failure/RcaLinkagePanel';
import { SisSifInterlockPanel } from '../barrier-safeguard-failure/SisSifInterlockPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';

export function BarrierSafeguardFailureTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentBarriers(incidentId);
  const mutations = useIncidentBarrierMutations(incidentId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Barrier / Safeguard Failure" message="Loading barrier register, performance, IPL/LOPA, SIS/SIF, PSV, alarm/operator, evidence, RCA, follow-ups, review, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Barrier / Safeguard Failure" message={error instanceof Error ? error.message : 'The barrier API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Barrier / Safeguard data" message="No Barrier / Safeguard Failure data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view Barrier / Safeguard Failure.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({ demandOccurred: 'Unknown', performanceStatus: 'Not determined', creditedIpl: 'Not Determined' }); setOpen(true); };
  const edit = (row: any) => { setForm(fromBarrier(row)); setOpen(true); };
  const save = async () => {
    try {
      if (form.id) await mutations.update.mutateAsync({ barrierId: form.id, values: normalizeBarrier(form) });
      else await mutations.create.mutateAsync(normalizeBarrier(form));
      setOpen(false);
      setMessage('Barrier / safeguard saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const supersede = async (row: any) => { const reason = window.prompt('Reason for cancelling/superseding this barrier'); if (!reason) return; try { await mutations.delete.mutateAsync({ barrierId: row.id, values: { reason } }); setMessage('Barrier superseded.'); } catch (event) { setMessage(errorText(event)); } };
  const linkEvidence = async (row: any) => { const evidenceId = window.prompt('Evidence ID to link'); if (!evidenceId) return; try { await mutations.linkEvidence.mutateAsync({ barrierId: row.id, values: { evidenceId } }); setMessage('Evidence linked.'); } catch (event) { setMessage(errorText(event)); } };
  const linkRca = async (row: any) => { const rcaItemId = window.prompt('RCA item ID to link'); if (!rcaItemId) return; try { await mutations.linkRca.mutateAsync({ barrierId: row.id, values: { rcaItemId } }); setMessage('RCA item linked.'); } catch (event) { setMessage(errorText(event)); } };
  const createFollowup = async (row?: any) => { try { await mutations.createFollowupAction.mutateAsync({ barrierId: row?.barrierId ?? row?.id, title: row?.title ?? 'Barrier follow-up action', followupType: row?.type ?? 'Barrier Follow-up', reason: row?.reason ?? 'Created from Barrier / Safeguard Failure tab' }); setMessage('Follow-up action created.'); } catch (event) { setMessage(errorText(event)); } };
  const requestReview = async () => { try { await mutations.requestReview.mutateAsync({ reason: 'Barrier review requested from tab' }); setMessage('Barrier review requested.'); } catch (event) { setMessage(errorText(event)); } };
  const approveReview = async () => { try { await mutations.approveReview.mutateAsync({ comments: 'Barrier review approved from tab' }); setMessage('Barrier review approved.'); } catch (event) { setMessage(errorText(event)); } };
  const rejectReview = async () => { const reason = window.prompt('Reason for rejecting barrier review'); if (!reason) return; try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Barrier review rejected.'); } catch (event) { setMessage(errorText(event)); } };

  return <div className="grid gap-4">
    <BarrierSafeguardHeader data={data} saving={saving} message={message} onAdd={add} onImportHazop={() => mutations.importHazop.mutateAsync().then(() => setMessage('HAZOP safeguards imported for review.')).catch((event) => setMessage(errorText(event)))} onImportLopa={() => mutations.importLopa.mutateAsync().then(() => setMessage('LOPA/IPL records imported for review.')).catch((event) => setMessage(errorText(event)))} onRequestReview={requestReview} onCreateFollowup={() => createFollowup()} onSaveChanges={() => setMessage('Open a barrier row to save detailed changes.')} onRefresh={() => refetch()} />
    <BarrierSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]"><BarrierSafeguardRegister rows={data.barrierRegister ?? []} onEdit={edit} onDelete={supersede} onEvidence={linkEvidence} onRca={linkRca} onFollowup={createFollowup} /><BarrierAnalysisReadinessPanel readiness={data.analysisReadiness ?? data.readiness} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><BarrierDemandPerformancePanel data={data.demandPerformance} /><FailureModeAnalysisPanel data={data.failureModeAnalysis} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><IplLopaCreditCheckPanel data={data.iplLopaCreditCheck} /><SisSifInterlockPanel data={data.sisSifInterlock} /><PsvReliefDevicePanel data={data.psvReliefDevice} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><AlarmOperatorResponsePanel data={data.alarmOperatorResponse} /><AdministrativeProcedurePtwPanel data={data.administrativeProcedurePtw} /><PpeEmergencyResponseBarrierPanel data={data.ppeEmergencyResponseBarrier} /></div>
    <BowtieBarrierMapPanel data={data.bowtieBarrierMap} />
    <div className="grid gap-4 xl:grid-cols-2"><EvidenceMappedBarrierPanel rows={data.evidenceMappedBarrier ?? []} /><RcaLinkagePanel rows={data.rcaLinkage ?? []} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><FollowupRequirementsPanel data={data.followupRequirements} onCreate={createFollowup} /><BarrierReviewPanel review={data.review} onRequest={requestReview} onApprove={approveReview} onReject={rejectReview} /><BarrierReadinessPanel readiness={data.readiness} /></div>
    <BarrierChangeHistoryPanel rows={data.changeHistory ?? []} />
    <AddEditBarrierDrawer open={open} form={form} set={set} saving={saving} onClose={() => setOpen(false)} onSave={save} />
  </div>;
}

function fromBarrier(row: any) {
  return {
    id: row.id,
    barrierName: row.barrier_name,
    barrierType: row.barrier_type,
    expectedFunction: row.expected_function,
    relatedHazard: row.related_hazard,
    equipmentId: row.equipment_id,
    chemicalId: row.chemical_id,
    hazopScenarioId: row.hazop_scenario_id,
    iplRecordId: row.ipl_record_id,
    demandOccurred: row.demand_occurred,
    demandAt: row.demand_at,
    expectedResponse: row.expected_response,
    actualResponse: row.actual_response,
    responseTime: row.response_time,
    performanceStatus: row.performance_status,
    failureMode: row.failure_mode,
    failureDescription: row.failure_description,
    immediateCause: row.immediate_cause,
    contributingCause: row.contributing_cause,
    creditedIpl: row.credited_ipl,
    iplType: row.ipl_type,
    pfdavgSnapshot: row.pfdavg_snapshot,
    rrfSnapshot: row.rrf_snapshot,
    proofTestStatus: row.proof_test_status,
    lastProofTest: row.last_proof_test,
    lopaReviewRequired: row.lopa_review_required,
    sisSifInvolved: row.sis_sif_involved,
    sifTag: row.sif_tag,
    tripSetpoint: row.trip_setpoint,
    psvReliefInvolved: row.psv_relief_involved,
    psvTag: row.psv_tag,
    setPressure: row.set_pressure,
    lastInspectionTest: row.last_inspection_test,
    alarmInterlockInvolved: row.alarm_interlock_involved,
    alarmTag: row.alarm_tag,
    alarmPriority: row.alarm_priority,
    procedureRequired: row.procedure_required,
    ptwRequired: row.ptw_required,
    ppeRequired: row.ppe_required,
    emergencyResponseRequired: row.emergency_response_required,
    notes: row.notes
  };
}

function normalizeBarrier(form: Record<string, any>) {
  return { ...form, pfdavgSnapshot: numberOrUndefined(form.pfdavgSnapshot), rrfSnapshot: numberOrUndefined(form.rrfSnapshot), performanceStatus: form.performanceStatus ?? 'Not determined', demandOccurred: form.demandOccurred ?? 'Unknown', creditedIpl: form.creditedIpl ?? 'Not Determined' };
}

function numberOrUndefined(value: any) {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
