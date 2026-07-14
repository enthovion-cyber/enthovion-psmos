'use client';

import { useState } from 'react';
import { useIncidentNotificationsReporting, useIncidentNotificationsReportingMutations } from '../../hooks/useIncidentNotificationsReporting';
import { AddEditRegulatoryReportDrawer } from '../notifications-regulatory/AddEditRegulatoryReportDrawer';
import { DeadlineEscalationPanel } from '../notifications-regulatory/DeadlineEscalationPanel';
import { ExternalStakeholderNotificationPanel } from '../notifications-regulatory/ExternalStakeholderNotificationPanel';
import { InternalNotificationsRegister } from '../notifications-regulatory/InternalNotificationsRegister';
import { ManagementLegalInsurancePanel } from '../notifications-regulatory/ManagementLegalInsurancePanel';
import { NotificationReportingChangeHistoryPanel } from '../notifications-regulatory/NotificationReportingChangeHistoryPanel';
import { NotificationReportingReadinessPanel } from '../notifications-regulatory/NotificationReportingReadinessPanel';
import { NotificationReportingReviewPanel } from '../notifications-regulatory/NotificationReportingReviewPanel';
import { NotificationsRegulatoryHeader } from '../notifications-regulatory/NotificationsRegulatoryHeader';
import { NotificationsRegulatorySummaryCards } from '../notifications-regulatory/NotificationsRegulatorySummaryCards';
import { RegulatoryReportingRegister } from '../notifications-regulatory/RegulatoryReportingRegister';
import { ReportPackageChecklistPanel } from '../notifications-regulatory/ReportPackageChecklistPanel';
import { ReportabilityCriteriaPanel } from '../notifications-regulatory/ReportabilityCriteriaPanel';
import { ReportingDeterminationPanel } from '../notifications-regulatory/ReportingDeterminationPanel';
import { SendNotificationDrawer } from '../notifications-regulatory/SendNotificationDrawer';
import { SubmissionAcknowledgementPanel } from '../notifications-regulatory/SubmissionAcknowledgementPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';

export function NotificationsRegulatoryReportingTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentNotificationsReporting(incidentId);
  const mutations = useIncidentNotificationsReportingMutations(incidentId);
  const [message, setMessage] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState<Record<string, any>>({});
  const [reportForm, setReportForm] = useState<Record<string, any>>({});
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Notifications / Regulatory Reporting" message="Loading determination, internal notifications, regulatory reports, deadlines, packages, stakeholders, review, history, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Notifications / Regulatory Reporting" message={error instanceof Error ? error.message : 'The notifications/reporting API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No reporting data" message="No notifications/regulatory reporting data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view notifications or regulatory reporting.'} tone="danger" />;

  const setNotification = (key: string, value: any) => setNotificationForm((current) => ({ ...current, [key]: value }));
  const setReport = (key: string, value: any) => setReportForm((current) => ({ ...current, [key]: value }));
  const openNotification = () => {
    setNotificationForm({ notificationType: 'Management escalation', channel: 'In-app', priority: 'Normal', includeIncidentSummary: true, acknowledgementRequired: false });
    setNotificationOpen(true);
  };
  const openReport = (row?: any) => {
    setReportForm(row ? fromReport(row) : { reportType: 'Initial notification', requiredStatus: 'Not Determined', status: 'Draft' });
    setReportOpen(true);
  };
  const saveNotification = async () => {
    try {
      await mutations.sendNotification.mutateAsync(notificationForm);
      setNotificationOpen(false);
      setMessage('Notification sent and recorded.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const saveReport = async () => {
    try {
      const values = normalizeReport(reportForm);
      if (reportForm.id) await mutations.updateReport.mutateAsync({ reportId: reportForm.id, values });
      else await mutations.createReport.mutateAsync(values);
      setReportOpen(false);
      setMessage('Regulatory report saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const runDetermination = async () => {
    try {
      await mutations.runDetermination.mutateAsync({ reason: 'Reporting determination run from tab' });
      setMessage('Reporting determination refreshed.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const resendNotification = async (row: any) => {
    try {
      await mutations.resendNotification.mutateAsync({ notificationId: row.id, values: { reason: 'Resent from Notifications / Regulatory Reporting tab' } });
      setMessage('Notification resent.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const acknowledgeNotification = async (row: any) => {
    const notes = window.prompt('Acknowledgement notes') ?? 'Acknowledged from tab';
    try {
      await mutations.acknowledgeNotification.mutateAsync({ notificationId: row.id, values: { notes } });
      setMessage('Notification acknowledged.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const packageReport = async (row?: any) => {
    const target = row ?? data.regulatoryReportsRegister?.[0];
    if (!target) { setMessage('No regulatory report is available for package generation.'); return; }
    try {
      await mutations.generatePackage.mutateAsync({ reportId: target.id, values: { reason: 'Generated from report package checklist' } });
      setMessage('Report package generated.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const requestApproval = async (row: any) => {
    try {
      await mutations.requestApproval.mutateAsync({ reportId: row.id, values: { reason: 'Approval requested from tab' } });
      setMessage('Report approval requested.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const markSubmitted = async (row: any) => {
    const reference = window.prompt('Submission reference or note');
    if (!reference) return;
    try {
      await mutations.markSubmitted.mutateAsync({ reportId: row.id, values: { submissionReference: reference, notes: reference } });
      setMessage('Report marked submitted.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const acknowledgeReport = async (row: any) => {
    const acknowledgementNumber = window.prompt('Acknowledgement/reference number or note');
    if (!acknowledgementNumber) return;
    try {
      await mutations.addAcknowledgement.mutateAsync({ reportId: row.id, values: { acknowledgementNumber, notes: acknowledgementNumber } });
      setMessage('Report acknowledgement recorded.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const rejectReport = async (row: any) => {
    const reason = window.prompt('Report rejection reason');
    if (!reason) return;
    try {
      await mutations.markRejected.mutateAsync({ reportId: row.id, values: { reason } });
      setMessage('Report rejection recorded.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const requestReview = async () => {
    try {
      await mutations.requestReview.mutateAsync({ reason: 'Notification/reporting review requested from tab' });
      setMessage('Review requested.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const approveReview = async () => {
    try {
      await mutations.approveReview.mutateAsync({ comments: 'Notification/reporting review approved from tab' });
      setMessage('Review approved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const rejectReview = async () => {
    const reason = window.prompt('Review rejection reason');
    if (!reason) return;
    try {
      await mutations.rejectReview.mutateAsync({ reason });
      setMessage('Review rejected.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const createFollowup = async () => {
    const title = window.prompt('Follow-up action title', 'Notifications / regulatory reporting follow-up');
    if (!title) return;
    try {
      await mutations.createFollowup.mutateAsync({ title, reason: title });
      setMessage('Follow-up action created.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  return <div className="grid gap-4">
    <NotificationsRegulatoryHeader data={data} saving={saving} message={message} onSend={openNotification} onAddReport={() => openReport()} onDetermine={runDetermination} onPackage={() => packageReport()} onReview={requestReview} onFollowup={createFollowup} onRefreshStatus={runDetermination} onExport={() => mutations.exportLog.mutateAsync().then(() => setMessage('Notification log export generated.')).catch((event) => setMessage(errorText(event)))} onRefresh={() => refetch()} />
    <NotificationsRegulatorySummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]"><ReportingDeterminationPanel data={data.determination} /><InternalNotificationsRegister rows={data.internalNotificationsRegister ?? []} onResend={resendNotification} onAcknowledge={acknowledgeNotification} /></div>
    <RegulatoryReportingRegister rows={data.regulatoryReportsRegister ?? []} onEdit={openReport} onPackage={packageReport} onApproval={requestApproval} onSubmit={markSubmitted} onAcknowledge={acknowledgeReport} onReject={rejectReport} />
    <div className="grid gap-4 xl:grid-cols-2"><ReportabilityCriteriaPanel rows={data.reportabilityCriteria ?? []} /><DeadlineEscalationPanel data={data.deadlines} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><ReportPackageChecklistPanel data={data.packageChecklist} /><SubmissionAcknowledgementPanel data={data.submissionAcknowledgement} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><ExternalStakeholderNotificationPanel data={data.externalStakeholders} /><ManagementLegalInsurancePanel data={data.managementLegalInsurance} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><NotificationReportingReviewPanel review={data.review} onRequest={requestReview} onApprove={approveReview} onReject={rejectReview} /><NotificationReportingReadinessPanel readiness={data.readiness} /></div>
    <NotificationReportingChangeHistoryPanel rows={data.changeHistory ?? []} />
    <SendNotificationDrawer open={notificationOpen} form={notificationForm} set={setNotification} context={data.context} saving={saving} onClose={() => setNotificationOpen(false)} onSave={saveNotification} />
    <AddEditRegulatoryReportDrawer open={reportOpen} form={reportForm} set={setReport} context={data.context} saving={saving} onClose={() => setReportOpen(false)} onSave={saveReport} />
  </div>;
}

function fromReport(row: Record<string, any>) {
  return {
    id: row.id,
    reportType: row.report_type,
    jurisdiction: row.jurisdiction,
    agency: row.agency,
    applicableRuleKey: row.applicable_rule_key,
    triggerReason: row.trigger_reason,
    requiredStatus: row.required_status,
    deadlineAt: row.deadline_at,
    ownerId: row.owner_id,
    reviewerId: row.reviewer_id,
    submissionMethod: row.submission_method,
    status: row.status,
    submissionReference: row.submission_reference,
    acknowledgementNumber: row.acknowledgement_number,
    notes: row.notes
  };
}

function normalizeReport(form: Record<string, any>) {
  return {
    reportType: form.reportType,
    jurisdiction: form.jurisdiction,
    agency: form.agency,
    applicableRuleKey: form.applicableRuleKey,
    triggerReason: form.triggerReason,
    requiredStatus: form.requiredStatus ?? 'Not Determined',
    deadlineAt: form.deadlineAt,
    ownerId: form.ownerId,
    reviewerId: form.reviewerId,
    submissionMethod: form.submissionMethod,
    status: form.status ?? 'Draft',
    submissionReference: form.submissionReference,
    acknowledgementNumber: form.acknowledgementNumber,
    notes: form.notes,
    reason: form.reason ?? form.notes
  };
}
