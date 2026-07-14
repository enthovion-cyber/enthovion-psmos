'use client';

import { useState } from 'react';
import { useIncidentRca, useIncidentRcaMutations } from '../../hooks/useIncidentRca';
import { AddEditCausalFactorDrawer } from '../root-cause-analysis/AddEditCausalFactorDrawer';
import { AddEditRootCauseDrawer } from '../root-cause-analysis/AddEditRootCauseDrawer';
import { CausalFactorsRegister } from '../root-cause-analysis/CausalFactorsRegister';
import { CauseClassificationPanel } from '../root-cause-analysis/CauseClassificationPanel';
import { CauseTreePanel } from '../root-cause-analysis/CauseTreePanel';
import { EvidenceMappedCausePanel } from '../root-cause-analysis/EvidenceMappedCausePanel';
import { FishboneAnalysisPanel } from '../root-cause-analysis/FishboneAnalysisPanel';
import { FiveWhyAnalysisPanel } from '../root-cause-analysis/FiveWhyAnalysisPanel';
import { RcaChangeHistoryPanel } from '../root-cause-analysis/RcaChangeHistoryPanel';
import { RcaHeader } from '../root-cause-analysis/RcaHeader';
import { RcaMethodSelectionPanel } from '../root-cause-analysis/RcaMethodSelectionPanel';
import { RcaPrerequisiteCheckPanel } from '../root-cause-analysis/RcaPrerequisiteCheckPanel';
import { RcaQualityCheckPanel } from '../root-cause-analysis/RcaQualityCheckPanel';
import { RcaReadinessPanel } from '../root-cause-analysis/RcaReadinessPanel';
import { RcaReviewPanel } from '../root-cause-analysis/RcaReviewPanel';
import { RcaSummaryCards } from '../root-cause-analysis/RcaSummaryCards';
import { RcaToCapaPreviewPanel } from '../root-cause-analysis/RcaToCapaPreviewPanel';
import { RootCauseRegister } from '../root-cause-analysis/RootCauseRegister';
import { SystemicWeaknessPanel } from '../root-cause-analysis/SystemicWeaknessPanel';
import { UnsupportedAssumptionsPanel } from '../root-cause-analysis/UnsupportedAssumptionsPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';

export function RootCauseAnalysisTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentRca(incidentId);
  const mutations = useIncidentRcaMutations(incidentId);
  const [factorOpen, setFactorOpen] = useState(false);
  const [rootOpen, setRootOpen] = useState(false);
  const [factorForm, setFactorForm] = useState<Record<string, any>>({});
  const [rootForm, setRootForm] = useState<Record<string, any>>({});
  const [methodForm, setMethodForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Root Cause Analysis" message="Loading RCA prerequisites, methods, causal factors, root causes, evidence mapping, quality, CAPA preview, review, and history." />;
  if (error) return <TabStatePanel title="Could not load Root Cause Analysis" message={error instanceof Error ? error.message : 'The RCA API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No RCA data" message="No Root Cause Analysis data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view Root Cause Analysis.'} tone="danger" />;

  const setFactor = (key: string, value: any) => setFactorForm((current) => ({ ...current, [key]: value }));
  const setRoot = (key: string, value: any) => setRootForm((current) => ({ ...current, [key]: value }));
  const setMethod = (key: string, value: any) => setMethodForm((current) => ({ ...current, [key]: value }));
  const addFactor = () => { setFactorForm({ status: 'Draft', evidenceSupportLevel: 'Not determined', confidenceLevel: 'Medium' }); setFactorOpen(true); };
  const addRoot = () => { setRootForm({ capaRequired: true, systemicCause: false, evidenceSupportLevel: 'Not determined' }); setRootOpen(true); };
  const editFactor = (row: any) => { setFactorForm(fromFactor(row)); setFactorOpen(true); };
  const editRoot = (row: any) => { setRootForm(fromRoot(row)); setRootOpen(true); };

  const saveFactor = async () => {
    try {
      const values = normalizeFactor(factorForm);
      if (factorForm.id) await mutations.updateCausalFactor.mutateAsync({ factorId: factorForm.id, values });
      else await mutations.createCausalFactor.mutateAsync(values);
      setFactorOpen(false);
      setMessage('Causal factor saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const saveRoot = async () => {
    try {
      const values = normalizeRoot(rootForm);
      if (rootForm.id) await mutations.updateRootCause.mutateAsync({ rootCauseId: rootForm.id, values });
      else await mutations.createRootCause.mutateAsync(values);
      setRootOpen(false);
      setMessage('Root cause saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const saveMethod = async () => { try { await mutations.updateMethod.mutateAsync({ ...methodForm, reason: methodForm.methodChangeReason ?? 'RCA method saved from tab' }); setMessage('RCA method saved.'); } catch (event) { setMessage(errorText(event)); } };
  const selectMethod = () => setMethodForm({ selectedMethod: data.method?.selectedMethod ?? '5-Why', rcaLeadId: data.method?.rcaLeadId, dueDate: data.method?.dueDate, scope: data.method?.scope, objective: data.method?.objective });
  const confirmFactor = async (factorId: string) => { try { await mutations.confirmCausalFactor.mutateAsync({ factorId, values: { justification: 'Confirmed from RCA tab' } }); setMessage('Causal factor confirmed.'); } catch (event) { setMessage(errorText(event)); } };
  const rejectFactor = async (factorId: string) => { const reason = window.prompt('Reason for rejecting this causal factor'); if (!reason) return; try { await mutations.rejectCausalFactor.mutateAsync({ factorId, values: { reason } }); setMessage('Causal factor rejected.'); } catch (event) { setMessage(errorText(event)); } };
  const linkFactorEvidence = async (factorId: string) => { const evidenceId = window.prompt('Evidence ID to link'); if (!evidenceId) return; try { await mutations.linkCausalFactorEvidence.mutateAsync({ factorId, values: { evidenceId, evidenceSupportLevel: 'Partial evidence' } }); setMessage('Evidence linked to causal factor.'); } catch (event) { setMessage(errorText(event)); } };
  const convertFactor = async (factorId: string) => { try { await mutations.convertFactorToRootCause.mutateAsync({ factorId, values: { reason: 'Promoted from causal factor register' } }); setMessage('Causal factor converted to root cause.'); } catch (event) { setMessage(errorText(event)); } };
  const deleteFactor = async (factorId: string) => { const reason = window.prompt('Reason for superseding this causal factor'); if (!reason) return; try { await mutations.deleteCausalFactor.mutateAsync({ factorId, values: { reason } }); setMessage('Causal factor superseded.'); } catch (event) { setMessage(errorText(event)); } };
  const deleteRoot = async (rootCauseId: string) => { const reason = window.prompt('Reason for archiving this root cause'); if (!reason) return; try { await mutations.deleteRootCause.mutateAsync({ rootCauseId, values: { reason } }); setMessage('Root cause archived.'); } catch (event) { setMessage(errorText(event)); } };
  const createCapa = async (rootCauseId?: string) => { const target = rootCauseId ?? data.rootCauseRegister?.find((row) => row.capa_required && !row.universal_action_id)?.id ?? data.rootCauseRegister?.[0]?.id; if (!target) { setMessage('No root cause is available for CAPA creation.'); return; } try { await mutations.createCapa.mutateAsync({ rootCauseId: target, values: { reason: 'CAPA created from Root Cause Analysis tab' } }); setMessage('CAPA/action linked from RCA root cause.'); } catch (event) { setMessage(errorText(event)); } };
  const requestReview = async () => { try { await mutations.requestReview.mutateAsync({ reason: 'RCA review requested from tab' }); setMessage('RCA review requested.'); } catch (event) { setMessage(errorText(event)); } };
  const approveReview = async () => { try { await mutations.approveReview.mutateAsync({ comments: 'RCA approved from tab' }); setMessage('RCA review approved.'); } catch (event) { setMessage(errorText(event)); } };
  const rejectReview = async () => { const reason = window.prompt('Reason for rejecting RCA review'); if (!reason) return; try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('RCA review rejected.'); } catch (event) { setMessage(errorText(event)); } };
  const completeRca = async () => { try { await mutations.complete.mutateAsync({ reason: 'RCA completed from tab' }); setMessage('RCA completed.'); } catch (event) { setMessage(errorText(event)); } };
  const reopenRca = async () => { const reason = window.prompt('Reason for reopening RCA'); if (!reason) return; try { await mutations.reopen.mutateAsync({ reason }); setMessage('RCA reopened.'); } catch (event) { setMessage(errorText(event)); } };
  const createSimple = async (kind: string) => {
    try {
      if (kind === 'fiveWhyChain') await mutations.upsertFiveWhyChain.mutateAsync({ problemStatement: window.prompt('5-Why problem statement') ?? 'Problem statement', status: 'Draft' });
      if (kind === 'fiveWhyStep') await mutations.upsertFiveWhyStep.mutateAsync({ chainId: window.prompt('Chain ID') ?? '', stepNumber: Number(window.prompt('Why step number') ?? '1'), whyStatement: window.prompt('Why statement') ?? 'Why statement' });
      if (kind === 'fishbone') await mutations.upsertFishboneItem.mutateAsync({ category: window.prompt('Fishbone category') ?? 'Other', causeItem: window.prompt('Cause item') ?? 'Cause item', status: 'Draft' });
      if (kind === 'treeNode') await mutations.upsertCauseTreeNode.mutateAsync({ nodeType: 'Cause', title: window.prompt('Node title') ?? 'Cause node', status: 'Draft' });
      if (kind === 'treeEdge') await mutations.upsertCauseTreeEdge.mutateAsync({ sourceNodeId: window.prompt('Source node ID') ?? '', targetNodeId: window.prompt('Target node ID') ?? '', relationshipType: window.prompt('Relationship type') ?? 'Causes' });
      if (kind === 'systemic') await mutations.upsertSystemicWeakness.mutateAsync({ managementSystemElement: window.prompt('Management system element') ?? 'Management System', weaknessDescription: window.prompt('Weakness description') ?? 'Weakness description', capaRequired: true });
      if (kind === 'hypothesis') await mutations.upsertHypothesis.mutateAsync({ hypothesis: window.prompt('Hypothesis') ?? 'Hypothesis', status: 'Open' });
      setMessage('RCA item saved.');
    } catch (event) { setMessage(errorText(event)); }
  };

  return <div className="grid gap-4">
    <RcaHeader data={data} saving={saving} message={message} onAddFactor={addFactor} onAddRootCause={addRoot} onSelectMethod={selectMethod} onReadiness={() => refetch()} onRequestReview={requestReview} onCreateCapa={() => createCapa()} onSaveChanges={saveMethod} onRefresh={() => refetch()} />
    <RcaSummaryCards cards={data.summaryCards ?? []} charts={data.charts ?? {}} />
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><RcaPrerequisiteCheckPanel data={data.prerequisites} /><RcaMethodSelectionPanel method={data.method} form={methodForm} set={setMethod} saving={saving} onSave={saveMethod} /></div>
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><CausalFactorsRegister rows={data.causalFactorsRegister} onEdit={editFactor} onConfirm={confirmFactor} onReject={rejectFactor} onLinkEvidence={linkFactorEvidence} onConvert={convertFactor} onDelete={deleteFactor} /><RcaReadinessPanel readiness={data.readiness} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><FiveWhyAnalysisPanel data={data.fiveWhy} onCreateChain={() => createSimple('fiveWhyChain')} onCreateStep={() => createSimple('fiveWhyStep')} /><FishboneAnalysisPanel data={data.fishbone} onCreate={() => createSimple('fishbone')} /><CauseTreePanel data={data.causeTree} onCreateNode={() => createSimple('treeNode')} onCreateEdge={() => createSimple('treeEdge')} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><CauseClassificationPanel data={data.causeClassification} /><EvidenceMappedCausePanel rows={data.evidenceMappedCauses ?? []} /></div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><RootCauseRegister rows={data.rootCauseRegister} onEdit={editRoot} onCreateCapa={createCapa} onDelete={deleteRoot} /><UnsupportedAssumptionsPanel data={data.unsupportedAssumptions} onCreate={() => createSimple('hypothesis')} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><SystemicWeaknessPanel rows={data.systemicWeaknesses} onCreate={() => createSimple('systemic')} /><RcaQualityCheckPanel data={data.qualityCheck} /><RcaToCapaPreviewPanel data={data.capaPreview} onCreate={createCapa} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><RcaReviewPanel review={data.review} onRequest={requestReview} onApprove={approveReview} onReject={rejectReview} onComplete={completeRca} onReopen={reopenRca} /><RcaChangeHistoryPanel rows={data.changeHistory ?? []} /></div>
    <AddEditCausalFactorDrawer open={factorOpen} form={factorForm} set={setFactor} saving={saving} onClose={() => setFactorOpen(false)} onSave={saveFactor} />
    <AddEditRootCauseDrawer open={rootOpen} form={rootForm} set={setRoot} saving={saving} onClose={() => setRootOpen(false)} onSave={saveRoot} />
  </div>;
}

function fromFactor(row: any) {
  return { id: row.id, title: row.title, description: row.description, category: row.category, causeStatement: row.cause_statement, status: row.status, evidenceSupportLevel: row.evidence_support_level, confidenceLevel: row.confidence_level, ownerId: row.owner_id, dueDate: row.due_date, notes: row.notes, hypothesis: row.hypothesis, relatedTimelineEventIdsText: (row.related_timeline_event_ids_json ?? []).join(', '), relatedEvidenceIdsText: (row.related_evidence_ids_json ?? []).join(', ') };
}

function fromRoot(row: any) {
  return { id: row.id, rootCauseStatement: row.root_cause_statement, category: row.category, description: row.description, evidenceSupportLevel: row.evidence_support_level, linkedCausalFactorIdsText: (row.linked_causal_factor_ids_json ?? []).join(', '), linkedEvidenceIdsText: (row.linked_evidence_ids_json ?? []).join(', '), systemicCause: row.systemic_cause, managementSystemElement: row.management_system_element, riskControlGap: row.risk_control_gap, capaRequired: row.capa_required, capaRequiredJustification: row.capa_required_justification, capaRecommendation: row.capa_recommendation, ownerId: row.owner_id, dueDate: row.due_date, notes: row.notes };
}

function splitIds(value?: string) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeFactor(form: Record<string, any>) {
  return { ...form, relatedTimelineEventIds: splitIds(form.relatedTimelineEventIdsText), relatedEvidenceIds: splitIds(form.relatedEvidenceIdsText), relatedRecords: splitIds(form.relatedRecordIdsText).map((id) => ({ id })) };
}

function normalizeRoot(form: Record<string, any>) {
  return { ...form, linkedCausalFactorIds: splitIds(form.linkedCausalFactorIdsText), linkedEvidenceIds: splitIds(form.linkedEvidenceIdsText), capaRequired: form.capaRequired !== false };
}
