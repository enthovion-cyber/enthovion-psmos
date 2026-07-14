'use client';

import { useEffect, useState } from 'react';
import { useMOCTemporaryEmergency } from '../../hooks/useMOCTemporaryEmergency';
import { useMOCTemporaryEmergencyMutations } from '../../hooks/useMOCTemporaryEmergencyMutations';
import { EmergencyFollowupActions } from '../emergency/EmergencyFollowupActions';
import { EmergencyJustificationPanel } from '../emergency/EmergencyJustificationPanel';
import { EmergencyReviewCountdown } from '../emergency/EmergencyReviewCountdown';
import { EmergencySummaryCard } from '../emergency/EmergencySummaryCard';
import { ImmediateRiskControls } from '../emergency/ImmediateRiskControls';
import { PostImplementationReview } from '../emergency/PostImplementationReview';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { NormalizationRiskIndicator, TemporaryActions } from '../temp/TempEmergencyComponents';
import { ReversalRemovalPlan } from '../temp/ReversalRemovalPlan';
import { TemporaryEscalationPanel } from '../temp/TemporaryEscalationPanel';
import { TemporaryExpiryCountdown } from '../temp/TemporaryExpiryCountdown';
import { TemporaryExtensionHistory } from '../temp/TemporaryExtensionHistory';
import { TemporaryExtensionRequests } from '../temp/TemporaryExtensionRequests';
import { TemporaryRiskControls } from '../temp/TemporaryRiskControls';
import { TemporarySummaryCard } from '../temp/TemporarySummaryCard';
import { EmergencyEscalationPanel } from '../emergency/EmergencyEscalationPanel';

export function MOCTemporaryEmergencyControlTab({ moc }: { moc: any }) {
  const { temporary, emergency } = useMOCTemporaryEmergency(moc.id);
  const mutations = useMOCTemporaryEmergencyMutations(moc.id);
  const [temporaryValues, setTemporaryValues] = useState<any>({});
  const [extensionRequest, setExtensionRequest] = useState<any>({});
  const [emergencyValues, setEmergencyValues] = useState<any>({});
  const [review, setReview] = useState<any>({});
  const [followup, setFollowup] = useState<any>({ title: 'Emergency MOC follow-up action', priority: 'HIGH' });

  useEffect(() => {
    const control = temporary.data?.control;
    if (control) setTemporaryValues({ expiryDate: control.expiry_date ?? '', maxDurationDays: control.max_duration_days ?? 90, reason: control.reason ?? '', riskControls: control.risk_controls ?? '', reversalPlan: control.reversal_plan ?? '', responsibleOwnerId: control.responsible_owner_id ?? control.removal_owner_id ?? '', reviewFrequency: control.review_frequency ?? '', temporaryOperatingLimits: control.temporary_operating_limits ?? '', temporaryProcedureReference: control.temporary_procedure_reference ?? '', removalVerificationRequired: control.removal_verification_required ?? true, removalCompleted: control.removal_completed, removalEvidenceAttachmentId: control.removal_evidence_attachment_id });
  }, [temporary.data]);

  useEffect(() => {
    const control = emergency.data?.control;
    if (control) setEmergencyValues({ emergencyJustification: control.emergency_justification ?? '', bypassReason: control.bypass_reason ?? '', immediateControls: control.immediate_controls ?? control.immediate_risk_controls ?? '', implementedBy: control.implemented_by ?? '', implementedAt: control.implemented_at ?? control.implementation_datetime ?? '', affectedEquipmentArea: control.affected_equipment_area ?? '', initialApprovalAuthorityId: control.initial_approval_authority_id ?? '', reviewDueAt: control.review_due_at ?? control.post_review_due_date ?? '', reviewOwnerId: control.review_owner_id ?? '', permanentMocRequired: control.permanent_moc_required ?? false });
  }, [emergency.data]);

  if (temporary.isLoading || emergency.isLoading) return <LoadingState />;
  if (temporary.isError || emergency.isError) return <ErrorState message="Unable to load temporary / emergency control data." />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <TemporarySummaryCard data={temporary.data} />
        <EmergencySummaryCard data={emergency.data} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TemporaryExpiryCountdown data={temporary.data} />
        <TemporaryRiskControls values={temporaryValues} setValues={setTemporaryValues} onSave={() => mutations.updateTemporary.mutate(temporaryValues)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReversalRemovalPlan values={temporaryValues} setValues={setTemporaryValues} onRemovalComplete={() => mutations.markRemovalComplete.mutate({ evidenceAttachmentId: temporaryValues.removalEvidenceAttachmentId })} />
        <TemporaryExtensionRequests request={extensionRequest} setRequest={setExtensionRequest} onRequest={() => mutations.requestExtension.mutate(extensionRequest)} onApprove={() => mutations.approveExtension.mutate(extensionRequest)} onReject={() => mutations.rejectExtension.mutate({ ...extensionRequest, reason: extensionRequest.reason ?? extensionRequest.justification ?? 'Extension rejected' })} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <TemporaryExtensionHistory extensions={temporary.data?.extensions ?? []} />
        <TemporaryEscalationPanel escalation={temporary.data?.escalation} />
        <NormalizationRiskIndicator risk={Boolean(temporary.data?.summary?.normalizationRisk)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr]">
        <EmergencyJustificationPanel values={emergencyValues} setValues={setEmergencyValues} onSave={() => mutations.updateEmergency.mutate(emergencyValues)} />
        <EmergencyReviewCountdown data={emergency.data} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ImmediateRiskControls values={emergencyValues} setValues={setEmergencyValues} />
        <PostImplementationReview review={review} setReview={setReview} onComplete={() => mutations.completeEmergencyReview.mutate(review)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <EmergencyFollowupActions action={followup} setAction={setFollowup} onCreate={() => mutations.createEmergencyFollowupAction.mutate(followup)} />
        <EmergencyEscalationPanel escalation={emergency.data?.escalation} />
        <TemporaryActions onReminder={() => mutations.updateTemporary.mutate(temporaryValues)} onConvert={() => mutations.convertTemporaryToPermanent.mutate({ reason: 'Converted from temporary control tab' })} />
      </div>
    </div>
  );
}
