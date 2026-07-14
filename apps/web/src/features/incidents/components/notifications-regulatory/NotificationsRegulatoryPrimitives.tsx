'use client';

import { Badge } from '../shared/IncidentStatusBadge';
import { Field, InfoRows, ReadinessContent, SelectField, SummaryCardGrid, TabPanel, TextArea, TimelineList, ToggleGrid, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { DeadlineStatusBadge } from '../shared/DeadlineStatusBadge';
import { NotificationStatusBadge } from '../shared/NotificationStatusBadge';
import { ReportRequiredBadge } from '../shared/ReportRequiredBadge';
import { ReportingStatusBadge } from '../shared/ReportingStatusBadge';
import { SubmissionStatusBadge } from '../shared/SubmissionStatusBadge';

export function ReportingCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }

export function ReportingHeaderFacts({ header }: { header: any }) {
  return <InfoRows rows={[
    ['Incident', `${header?.incidentNumber ?? '-'} - ${header?.incidentTitle ?? '-'}`],
    ['Status / Severity', `${header?.incidentStatus ?? '-'} / ${header?.actualSeverity ?? '-'} actual / ${header?.potentialSeverity ?? '-'} potential`],
    ['PSM/PSE/API tier', header?.psmPseApiTier],
    ['Reporting required', header?.reportingRequired],
    ['Notifications / Reports', `${header?.internalNotificationsStatus ?? '-'} / ${header?.regulatoryReportingStatus ?? '-'}`],
    ['Open / Overdue / Pending approval', `${header?.openReports ?? 0} / ${header?.overdueReports ?? 0} / ${header?.pendingApprovals ?? 0}`],
    ['Submitted / Acknowledged / Failed notifications', `${header?.submittedReports ?? 0} / ${header?.acknowledgedReports ?? 0} / ${header?.failedNotifications ?? 0}`],
    ['Next deadline / Review', `${formatDate(header?.nextReportingDeadline)} / ${header?.reviewStatus ?? '-'}`],
    ['Last updated', formatDate(header?.lastUpdated)]
  ]} />;
}

export function ReportingSimplePanel({ title, data, empty = 'No backend records were returned for this panel.' }: { title: string; data: any; empty?: string }) {
  const rows = Array.isArray(data) ? data : data?.rows ?? [];
  return <TabPanel title={title}>
    <div className="grid gap-3">
      {data?.status ? <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Backend status</span><ReportingStatusBadge value={data.status} /></div> : null}
      {data?.warning ? <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-200">{data.warning}</div> : null}
      <TimelineList rows={rows} empty={empty} columns />
    </div>
  </TabPanel>;
}

export function NotificationTable({ rows, onResend, onAcknowledge }: any) {
  if (!rows?.length) return <p className="text-xs text-slate-500">No internal notifications have been sent yet.</p>;
  return <div className="overflow-x-auto">
    <table className="min-w-[1450px] text-left text-xs">
      <thead className="text-[11px] uppercase text-slate-500"><tr>{['Notification','Type','Recipient','Channel','Trigger','Status','Sent','Acknowledged','Failed reason','Related','Actions'].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((row: any) => <tr key={row.id} className="border-t border-slate-200 align-top dark:border-cyan-300/10">
        <td className="p-2 font-bold">{row.notification_number}</td>
        <td className="p-2">{row.notification_type}</td>
        <td className="p-2">{row.recipient_user_id ?? row.recipient_group ?? row.recipient_external_contact ?? '-'}</td>
        <td className="p-2">{row.channel}</td>
        <td className="p-2">{row.trigger_reason ?? '-'}</td>
        <td className="p-2"><NotificationStatusBadge value={row.status} /></td>
        <td className="p-2">{row.sent_by ?? '-'}<div className="text-slate-500">{formatDate(row.sent_at)}</div></td>
        <td className="p-2">{row.acknowledged_by ?? '-'}<div className="text-slate-500">{formatDate(row.acknowledged_at)}</div></td>
        <td className="p-2">{row.failed_reason ?? '-'}</td>
        <td className="p-2">{row.related_report_id ?? row.related_action_id ?? '-'}</td>
        <td className="p-2"><div className="flex flex-wrap gap-1"><button className={buttonSecondary} onClick={() => onResend?.(row)}>Retry</button><button className={buttonSecondary} onClick={() => onAcknowledge?.(row)}>Acknowledge</button></div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function RegulatoryReportTable({ rows, onEdit, onPackage, onApproval, onSubmit, onAcknowledge, onReject }: any) {
  if (!rows?.length) return <p className="text-xs text-slate-500">No regulatory reports exist. Add a report or run reporting determination to generate requirements.</p>;
  return <div className="overflow-x-auto">
    <table className="min-w-[1650px] text-left text-xs">
      <thead className="text-[11px] uppercase text-slate-500"><tr>{['Report','Type','Jurisdiction / Agency','Trigger','Deadline','Status','Owner','Reviewer','Submission','Acknowledgement','Package','Actions'].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((row: any) => <tr key={row.id} className="border-t border-slate-200 align-top dark:border-cyan-300/10">
        <td className="p-2 font-bold">{row.report_number}</td>
        <td className="p-2">{row.report_type}<div><ReportRequiredBadge value={row.required_status} /></div></td>
        <td className="p-2">{row.jurisdiction ?? '-'}<div className="text-slate-500">{row.agency ?? '-'}</div></td>
        <td className="p-2">{row.trigger_reason ?? '-'}</td>
        <td className="p-2">{formatDate(row.deadline_at)}<div><DeadlineStatusBadge value={row.status === 'Overdue' ? 'Overdue' : row.deadline_at ? 'Tracked' : 'No Deadline'} /></div></td>
        <td className="p-2"><ReportingStatusBadge value={row.status} /></td>
        <td className="p-2">{row.owner_id ?? '-'}</td>
        <td className="p-2">{row.reviewer_id ?? '-'}</td>
        <td className="p-2">{row.submission_method ?? '-'}<div className="text-slate-500">{formatDate(row.submitted_at)}</div><SubmissionStatusBadge value={row.submission_reference ? 'Referenced' : row.status} /></td>
        <td className="p-2">{row.acknowledgement_number ?? '-'}<div className="text-slate-500">{formatDate(row.acknowledgement_at)}</div></td>
        <td className="p-2">{row.package_status ?? 'Not Generated'}</td>
        <td className="p-2"><div className="flex min-w-[340px] flex-wrap gap-1">
          <button className={buttonSecondary} onClick={() => onEdit?.(row)}>Edit</button>
          <button className={buttonSecondary} onClick={() => onPackage?.(row)}>Package</button>
          <button className={buttonSecondary} onClick={() => onApproval?.(row)}>Approval</button>
          <button className={buttonSecondary} onClick={() => onSubmit?.(row)}>Submit</button>
          <button className={buttonSecondary} onClick={() => onAcknowledge?.(row)}>Acknowledge</button>
          <button className={buttonSecondary} onClick={() => onReject?.(row)}>Reject</button>
        </div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function NotificationDrawerForm({ form, set, context }: any) {
  return <div className="grid gap-3 md:grid-cols-2">
    <SelectField label="Notification type" value={form.notificationType} options={context?.notificationTypes ?? []} onChange={(value) => set('notificationType', value)} />
    <SelectField label="Channel" value={form.channel} options={context?.channels ?? []} onChange={(value) => set('channel', value)} />
    <Field label="Recipient user ID" value={form.recipientUserId} onChange={(value) => set('recipientUserId', value)} />
    <Field label="Recipient role/group" value={form.recipientGroup} onChange={(value) => set('recipientGroup', value)} />
    <Field label="External contact" value={form.recipientExternalContact} onChange={(value) => set('recipientExternalContact', value)} />
    <Field label="Priority" value={form.priority} onChange={(value) => set('priority', value)} />
    <Field label="Subject/title" value={form.subject} onChange={(value) => set('subject', value)} wide />
    <TextArea className="md:col-span-2" label="Message" value={form.message} onChange={(value) => set('message', value)} />
    <Field label="Related report/action" value={form.relatedReportId ?? form.relatedActionId} onChange={(value) => set('relatedReportId', value)} />
    <Field label="Acknowledgement due date" type="datetime-local" value={form.acknowledgementDueAt} onChange={(value) => set('acknowledgementDueAt', value)} />
    <TextArea className="md:col-span-2" label="Notes" value={form.notes} onChange={(value) => set('notes', value)} />
    <div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[[ 'includeIncidentSummary', 'Include incident summary' ], [ 'includeRestrictedData', 'Include restricted data' ], [ 'includeAttachments', 'Include attachments/evidence' ], [ 'acknowledgementRequired', 'Acknowledgement required' ]]} /></div>
  </div>;
}

export function RegulatoryReportDrawerForm({ form, set, context }: any) {
  return <div className="grid gap-3 md:grid-cols-2">
    <SelectField label="Report type" value={form.reportType} options={context?.reportTypes ?? []} onChange={(value) => set('reportType', value)} />
    <SelectField label="Status" value={form.status} options={context?.reportStatuses ?? []} onChange={(value) => set('status', value)} />
    <Field label="Jurisdiction" value={form.jurisdiction} onChange={(value) => set('jurisdiction', value)} />
    <Field label="Agency/authority" value={form.agency} onChange={(value) => set('agency', value)} />
    <Field label="Applicable rule/config" value={form.applicableRuleKey} onChange={(value) => set('applicableRuleKey', value)} />
    <SelectField label="Required" value={form.requiredStatus} options={['Yes','No','Not Determined','Required','Not Required']} onChange={(value) => set('requiredStatus', value)} />
    <Field label="Deadline" type="datetime-local" value={form.deadlineAt} onChange={(value) => set('deadlineAt', value)} />
    <Field label="Owner" value={form.ownerId} onChange={(value) => set('ownerId', value)} />
    <Field label="Reviewer/approver" value={form.reviewerId} onChange={(value) => set('reviewerId', value)} />
    <Field label="Submission method" value={form.submissionMethod} onChange={(value) => set('submissionMethod', value)} />
    <Field label="Submission reference" value={form.submissionReference} onChange={(value) => set('submissionReference', value)} />
    <Field label="Acknowledgement/reference number" value={form.acknowledgementNumber} onChange={(value) => set('acknowledgementNumber', value)} />
    <TextArea className="md:col-span-2" label="Trigger reason" value={form.triggerReason} onChange={(value) => set('triggerReason', value)} />
    <TextArea className="md:col-span-2" label="Submission notes / change reason" value={form.notes ?? form.reason} onChange={(value) => { set('notes', value); set('reason', value); }} />
  </div>;
}

export function ReportingReadinessContent({ readiness }: { readiness: any }) { return <ReadinessContent readiness={readiness} />; }
