'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MiWorkOrderDetailResponse, MiWorkOrderLookups } from '../types/work-order.types';
import { validateWorkOrderDraft } from '../schemas/work-order.schema';
import { useWorkOrderMutations } from '../hooks/useWorkOrders';
import { ActionButton, PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { WorkOrderSourceSection } from './sections/WorkOrderSourceSection';
import { WorkDetailsSection } from './sections/WorkDetailsSection';
import { WorkRiskReadinessSection } from './sections/WorkRiskReadinessSection';
import { WorkPlanningSection } from './sections/WorkPlanningSection';
import { PtwLotoSafetySection } from './sections/PtwLotoSafetySection';
import { PartsResourcesSection } from './sections/PartsResourcesSection';
import { WorkLinkedRecordsSection } from './sections/WorkLinkedRecordsSection';

export function WorkOrderForm({ detail, lookups, preset = {} }: { detail?: MiWorkOrderDetailResponse | undefined; lookups?: MiWorkOrderLookups | undefined; preset?: Record<string, unknown> }) {
  const router = useRouter();
  const row = detail?.workOrder;
  const [values, setValues] = useState<Record<string, any>>({
    equipmentId: row?.equipment_id ?? preset.equipmentId ?? '',
    sourceModule: row?.source_module ?? preset.sourceModule ?? '',
    sourceRecordId: row?.source_record_id ?? preset.sourceRecordId ?? '',
    sourceRecordNumber: row?.source_record_number ?? preset.sourceRecordNumber ?? '',
    sourceSummary: row?.source_summary ?? preset.sourceSummary ?? '',
    currentEquipmentStatus: row?.current_equipment_status ?? preset.currentEquipmentStatus ?? '',
    currentReadinessStatus: row?.current_readiness_status ?? preset.currentReadinessStatus ?? '',
    criticality: row?.equipment_criticality ?? preset.criticality ?? '',
    linkedDeficiencyId: row?.linked_deficiency_id ?? preset.linkedDeficiencyId ?? '',
    linkedDeviationId: row?.linked_deviation_id ?? preset.linkedDeviationId ?? '',
    linkedActionId: row?.linked_action_id ?? preset.linkedActionId ?? '',
    title: row?.title ?? '',
    description: row?.description ?? '',
    workOrderType: row?.work_order_type ?? preset.workOrderType ?? '',
    workCategory: row?.work_category ?? preset.workCategory ?? '',
    workReason: row?.work_reason ?? '',
    requiredWorkScope: row?.required_work_scope ?? '',
    repairMethod: row?.repair_method ?? '',
    expectedOutcome: row?.expected_outcome ?? '',
    acceptanceCriteria: row?.acceptance_criteria ?? '',
    workInstructions: row?.work_instructions ?? '',
    completionEvidenceRequired: row?.completion_evidence_required ?? false,
    verificationRequired: row?.verification_required ?? false,
    status: row?.status ?? 'Draft',
    priority: row?.priority ?? 'Medium',
    riskLevel: row?.risk_level ?? 'Medium',
    safetyCriticalWork: row?.safety_critical_work ?? false,
    psmCriticalWork: row?.psm_critical_work ?? false,
    readinessImpact: row?.readiness_impact ?? '',
    startupBlocker: row?.startup_blocker ?? false,
    startupBlockerReason: row?.startup_blocker_reason ?? '',
    dueDate: row?.due_date ?? preset.dueDate ?? '',
    ownerUserId: row?.owner_user_id ?? '',
    assignedUserId: row?.assigned_user_id ?? '',
    assignedTeamId: row?.assigned_team_id ?? '',
    contractorVendor: row?.contractor_vendor ?? '',
    operationAllowedBeforeCompletion: row?.operation_allowed_before_completion ?? true,
    temporaryControlRequired: row?.temporary_control_required ?? false,
    temporaryControlDescription: row?.temporary_control_description ?? '',
    ffsRequired: row?.ffs_required ?? false,
    engineeringReviewRequired: row?.engineering_review_required ?? false,
    mocRequired: row?.moc_required ?? false,
    mocSuggested: row?.moc_suggested ?? false,
    pssrImpact: row?.pssr_impact ?? false,
    lopaSilImpact: row?.lopa_sil_impact ?? false,
    plannedStartAt: row?.planned_start_at ?? '',
    plannedFinishAt: row?.planned_finish_at ?? '',
    estimatedDurationMinutes: row?.estimated_duration_minutes ?? '',
    requiredShutdown: row?.required_shutdown ?? false,
    shutdownWindow: row?.shutdown_window ?? '',
    onlineWorkAllowed: row?.online_work_allowed ?? true,
    requiredOutageType: row?.required_outage_type ?? '',
    jobPlan: row?.job_plan ?? '',
    sequencingNotes: row?.sequencing_notes ?? '',
    requiredCoordination: row?.required_coordination ?? '',
    simopsConcern: row?.simops_concern ?? false,
    preJobBriefingRequired: row?.pre_job_briefing_required ?? false,
    toolboxTalkRequired: row?.toolbox_talk_required ?? false,
    ptwRequired: row?.ptw_required ?? false,
    ptwType: row?.ptw_type ?? '',
    linkedPtwId: row?.linked_ptw_id ?? '',
    lotoRequired: row?.loto_required ?? false,
    linkedLotoId: row?.linked_loto_id ?? '',
    confinedSpaceRequired: row?.confined_space_required ?? false,
    hotWorkRequired: row?.hot_work_required ?? false,
    lineBreakRequired: row?.line_break_required ?? false,
    electricalIsolationRequired: row?.electrical_isolation_required ?? false,
    workingAtHeightRequired: row?.working_at_height_required ?? false,
    liftingRequired: row?.lifting_required ?? false,
    gasTestRequired: row?.gas_test_required ?? false,
    ppeRequirements: row?.ppe_requirements ?? '',
    safetyPrecautions: row?.safety_precautions ?? '',
    jsaRequired: row?.jsa_required ?? false,
    jhaRequired: row?.jha_required ?? false,
    riskAssessmentDocumentId: row?.risk_assessment_document_id ?? '',
    methodStatementDocumentId: row?.method_statement_document_id ?? '',
    partsRequired: row?.parts_required ?? false,
    sparePartsList: row?.spare_parts_list ?? '',
    materialList: row?.material_list ?? '',
    toolsRequired: row?.tools_required ?? '',
    specialEquipment: row?.special_equipment ?? '',
    craneLiftingRequired: row?.crane_lifting_required ?? false,
    scaffoldingRequired: row?.scaffolding_required ?? false,
    contractorRequired: row?.contractor_required ?? false,
    vendorRequired: row?.vendor_required ?? false,
    partsStatus: row?.parts_status ?? 'Not Required',
    estimatedCost: row?.estimated_cost ?? '',
    costCenter: row?.cost_center ?? '',
    purchaseRequestReference: row?.purchase_request_reference ?? '',
    externalCmmsReference: row?.external_cmms_reference ?? '',
    notes: row?.notes ?? ''
  });
  const [error, setError] = useState<string | null>(null);
  const mutations = useWorkOrderMutations(row?.id);
  const change = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const save = async () => {
    const missing = validateWorkOrderDraft(values);
    if (missing.length) {
      setError(`Missing required fields: ${missing.join(', ')}`);
      return;
    }
    setError(null);
    const result = row?.id ? await mutations.update.mutateAsync(values) : await mutations.create.mutateAsync(values);
    router.push(`/mechanical-integrity/work-orders/${result.workOrder.id}`);
  };
  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <SectionCard title="1. Source & Equipment"><WorkOrderSourceSection values={values} onChange={change} /></SectionCard>
      <SectionCard title="2. Work Details"><WorkDetailsSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="3. Risk / Priority / Readiness"><WorkRiskReadinessSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="4. Planning"><WorkPlanningSection values={values} onChange={change} /></SectionCard>
      <SectionCard title="5. PTW / LOTO / Safety"><PtwLotoSafetySection values={values} onChange={change} /></SectionCard>
      <SectionCard title="6. Parts / Resources"><PartsResourcesSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="7. Linked Records"><WorkLinkedRecordsSection values={values} onChange={change} /></SectionCard>
      <SectionCard title="8. Review & Submit" description="Save work order first; submit/approve/start/complete/verify from the detail workflow.">
        <div className="flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>Save Work Order</PrimaryButton><ActionButton onClick={() => router.push('/mechanical-integrity/work-orders')}>Cancel</ActionButton></div>
      </SectionCard>
    </form>
  );
}
