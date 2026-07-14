'use client';

import { useEffect, useState } from 'react';
import { ClassificationChangeHistoryPanel } from '../event-details/ClassificationChangeHistoryPanel';
import { ClassificationReviewPanel } from '../event-details/ClassificationReviewPanel';
import { CoreEventInformationPanel } from '../event-details/CoreEventInformationPanel';
import { EnvironmentalCommunityImpactPanel } from '../event-details/EnvironmentalCommunityImpactPanel';
import { EventDescriptionPanel } from '../event-details/EventDescriptionPanel';
import { EventDetailsHeader } from '../event-details/EventDetailsHeader';
import { EventDetailsReadinessPanel } from '../event-details/EventDetailsReadinessPanel';
import { EventSummaryCards } from '../event-details/EventSummaryCards';
import { EventTypeClassificationPanel } from '../event-details/EventTypeClassificationPanel';
import { LocationTimeOperationPanel } from '../event-details/LocationTimeOperationPanel';
import { PsmPseClassificationPanel } from '../event-details/PsmPseClassificationPanel';
import { PtwMocPssrContextPanel } from '../event-details/PtwMocPssrContextPanel';
import { ReporterWitnessSnapshotPanel } from '../event-details/ReporterWitnessSnapshotPanel';
import { RequestClassificationReviewDialog } from '../event-details/RequestClassificationReviewDialog';
import { ApproveClassificationDialog } from '../event-details/ApproveClassificationDialog';
import { RejectClassificationDialog } from '../event-details/RejectClassificationDialog';
import { TabStatePanel, errorText, toLocalInput } from '../shared/IncidentTabPrimitives';
import { useIncidentEventDetails, useIncidentEventDetailsMutations } from '../../hooks/useIncidentEventDetails';

export function EventDetailsClassificationTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentEventDetails(incidentId);
  const mutations = useIncidentEventDetailsMutations(incidentId);
  const [form, setForm] = useState<Record<string, any>>({});
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    if (!data || data.restricted) return;
    setForm({
      title: data.coreEventInformation?.title ?? '',
      shortDescription: data.coreEventInformation?.shortDescription ?? '',
      eventType: data.coreEventInformation?.eventType ?? '',
      classification: data.coreEventInformation?.classification ?? '',
      detailedDescription: data.eventDescription?.detailedDescription ?? '',
      eventDateTime: toLocalInput(data.locationTimeOperation?.eventDateTime),
      reportedDateTime: toLocalInput(data.locationTimeOperation?.reportedDateTime),
      exactLocation: data.locationTimeOperation?.exactLocation ?? '',
      operatingMode: data.locationTimeOperation?.operatingMode ?? '',
      shift: data.locationTimeOperation?.shift ?? '',
      workgroup: data.locationTimeOperation?.workgroup ?? '',
      weatherCondition: data.locationTimeOperation?.weatherCondition ?? '',
      activityAtTime: data.eventDescription?.activityAtTime ?? '',
      abnormalCondition: data.eventDescription?.abnormalCondition ?? '',
      immediateConsequence: data.eventDescription?.immediateConsequence ?? '',
      potentialConsequence: data.eventDescription?.potentialConsequence ?? '',
      suspectedInitialCause: data.eventDescription?.suspectedInitialCause ?? '',
      witnessesKnown: !!data.eventDescription?.witnessesKnown,
      emergencyResponseActivated: !!data.eventDescription?.emergencyResponseActivated,
      operationStopped: !!data.eventDescription?.operationStopped,
      equipmentIsolated: !!data.eventDescription?.equipmentIsolated,
      areaBarricaded: !!data.eventDescription?.areaBarricaded,
      ptwInvolved: !!data.ptwMocPssrContext?.ptwInvolved,
      ptwId: data.ptwMocPssrContext?.ptwId ?? '',
      ptwReviewRequired: !!data.ptwMocPssrContext?.ptwReviewRequired,
      mocInvolved: !!data.ptwMocPssrContext?.mocInvolved,
      mocId: data.ptwMocPssrContext?.mocId ?? '',
      mocRequired: !!data.ptwMocPssrContext?.mocRequired,
      pssrInvolved: !!data.ptwMocPssrContext?.pssrInvolved,
      pssrId: data.ptwMocPssrContext?.pssrId ?? '',
      pssrRequired: !!data.ptwMocPssrContext?.pssrRequired,
      lopcStatus: data.psmPseClassification?.lopcStatus ?? '',
      releasedMaterial: data.environmentalCommunityImpact?.releasedMaterial ?? '',
      releasedQuantity: data.environmentalCommunityImpact?.releasedQuantity ?? '',
      releaseUnit: data.environmentalCommunityImpact?.releaseUnit ?? '',
      releaseDuration: data.environmentalCommunityImpact?.releaseDuration ?? '',
      thresholdExceeded: data.environmentalCommunityImpact?.thresholdExceeded ?? '',
      acuteRelease: !!data.psmPseClassification?.acuteRelease,
      fireExplosionOccurred: !!data.psmPseClassification?.fireExplosionOccurred,
      toxicExposureOccurred: !!data.psmPseClassification?.toxicExposureOccurred,
      injuryFatalityOccurred: !!data.psmPseClassification?.injuryFatalityOccurred,
      environmentalImpact: !!data.environmentalCommunityImpact?.environmentalImpact,
      communityImpact: !!data.environmentalCommunityImpact?.communityImpact,
      regulatoryReportingRequired: !!data.environmentalCommunityImpact?.regulatoryReportingRequired,
      pseClassificationBasis: data.psmPseClassification?.basis ?? '',
      reporterDepartment: data.reporterWitnessSnapshot?.reporterDepartment ?? '',
      reporterRole: data.reporterWitnessSnapshot?.reporterRole ?? '',
      reporterContact: data.reporterWitnessSnapshot?.reporterContact ?? ''
    });
  }, [data]);

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const saving = mutations.save.isPending || mutations.requestReview.isPending || mutations.approve.isPending || mutations.reject.isPending;

  if (isLoading) return <TabStatePanel title="Loading Event Details & Classification" message="Loading backend event details, PSM/PSE classification, readiness, and history." />;
  if (error) return <TabStatePanel title="Could not load Event Details & Classification" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Event Details data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this incident.'} tone="danger" />;

  const save = async () => {
    setMessage(null);
    try {
      await mutations.save.mutateAsync({ ...form, reason: reason || 'Event Details & Classification tab saved' });
      setMessage('Event details saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const requestReview = async () => {
    setMessage(null);
    try {
      await mutations.requestReview.mutateAsync({ reason: reason || 'Classification review requested from Event Details tab' });
      setMessage('Classification review requested.');
      setRequestDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const approveReview = async () => {
    setMessage(null);
    try {
      await mutations.approve.mutateAsync({ reason: reason || 'Classification approved' });
      setMessage('Classification approved.');
      setApproveDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const rejectReview = async () => {
    setMessage(null);
    try {
      await mutations.reject.mutateAsync({ reason });
      setMessage('Classification rejected.');
      setRejectDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const canSave = !!data.actions?.find((action: any) => action.key === 'save')?.enabled;
  const canRequest = !!data.actions?.find((action: any) => action.key === 'request-classification-review')?.enabled;

  return (
    <div className="grid gap-4">
      <EventDetailsHeader
        data={data}
        saving={saving}
        canSave={canSave}
        canRequest={canRequest}
        disabledReason={data.actions?.find((action: any) => action.key === 'save')?.disabledReason}
        requestDisabledReason={data.actions?.find((action: any) => action.key === 'request-classification-review')?.disabledReason}
        message={message}
        onSave={save}
        onRequestReview={() => setRequestDialogOpen(true)}
        onRefresh={() => refetch()}
      />
      <EventSummaryCards cards={data.summaryCards ?? []} />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <CoreEventInformationPanel form={form} set={set} data={data} />
        <EventDetailsReadinessPanel readiness={data.readiness} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LocationTimeOperationPanel form={form} set={set} data={data} />
        <EventDescriptionPanel form={form} set={set} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <EventTypeClassificationPanel data={data} />
        <PsmPseClassificationPanel data={data} form={form} set={set} />
        <PtwMocPssrContextPanel form={form} set={set} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <EnvironmentalCommunityImpactPanel form={form} set={set} />
        <ReporterWitnessSnapshotPanel data={data} />
        <ClassificationReviewPanel data={data} reason={reason} setReason={setReason} saving={saving} onApprove={() => setApproveDialogOpen(true)} onReject={() => setRejectDialogOpen(true)} />
      </div>
      <ClassificationChangeHistoryPanel rows={data.classificationChangeHistory ?? []} />
      <RequestClassificationReviewDialog open={requestDialogOpen} reason={reason} setReason={setReason} saving={saving} onCancel={() => setRequestDialogOpen(false)} onConfirm={requestReview} />
      <ApproveClassificationDialog open={approveDialogOpen} reason={reason} setReason={setReason} saving={saving} onCancel={() => setApproveDialogOpen(false)} onConfirm={approveReview} />
      <RejectClassificationDialog open={rejectDialogOpen} reason={reason} setReason={setReason} saving={saving} onCancel={() => setRejectDialogOpen(false)} onConfirm={rejectReview} />
    </div>
  );
}
