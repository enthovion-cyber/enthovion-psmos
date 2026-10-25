'use client';

import { AlertTriangle, Bell, CheckCircle2, Clock, FileUp, Flame, RotateCcw, ShieldAlert, TimerReset } from 'lucide-react';
import { Badge, DetailCard, EmptyState, Field, Metric, MocButton, ProgressBar, detailInput, detailTextarea, statusTone } from '../moc-detail-ui';

export function TemporarySummaryCard({ data }: { data: any }) {
  const summary = data?.summary ?? {};
  return (
    <DetailCard title="Temporary Change Summary">
      {!data?.applicable ? <EmptyState title="This MOC is not a temporary change." /> : null}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Metric label="Status" value={summary.status ?? '-'} tone={statusTone(summary.status)} />
        <Metric label="Days Remaining" value={summary.daysRemaining ?? '-'} tone={(summary.daysRemaining ?? 999) < 0 ? 'red' : (summary.daysRemaining ?? 999) <= 7 ? 'amber' : 'green'} />
        <Metric label="Duration" value={`${summary.currentDurationDays ?? 0}d`} tone={(summary.currentDurationDays ?? 0) > 60 ? 'amber' : 'slate'} sub={`Max ${summary.maxDurationDays ?? 90} days`} />
        <Metric label="Extensions" value={summary.extensionCount ?? 0} tone={(summary.extensionCount ?? 0) ? 'amber' : 'slate'} />
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 sm:grid-cols-2 md:grid-cols-3">
        <Info label="Expiry Date" value={summary.expiryDate ?? '-'} />
        <Info label="Removal Owner" value={summary.ownerResponsibleForRemoval ?? '-'} />
        <Info label="Reversal Plan" value={summary.reversalPlanStatus ?? '-'} />
        <Info label="Overdue Flag" value={summary.overdue ? 'Yes' : 'No'} />
        <Info label="Normalization Risk" value={summary.normalizationRisk ? 'Yes - active > 60 days' : 'No'} />
        <Info label="Maximum Allowed Duration" value={`${summary.maxDurationDays ?? 90} days`} />
      </div>
    </DetailCard>
  );
}

export function TemporaryExpiryCountdown({ data }: { data: any }) {
  const days = data?.summary?.daysRemaining;
  const percent = days == null ? 0 : Math.max(0, Math.min(100, ((data.summary.maxDurationDays - Math.max(days, 0)) / data.summary.maxDurationDays) * 100));
  return (
    <DetailCard title="Expiry Countdown Panel">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="grid h-24 w-24 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-200">{days ?? '-'}</p>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">days</p>
          </div>
        </div>
        <div className="flex-1 w-full">
          <p className="font-black text-[var(--psm-fg)]">
            {days == null ? 'Expiry not set' : days < 0 ? 'Overdue Temporary Change' : days <= 7 ? 'Final warning window' : days <= 30 ? '30-day warning window' : 'Within allowed duration'}
          </p>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Warnings escalate from originator and department head to HSE Manager and Plant Manager as expiry approaches.</p>
          <div className="mt-4"><ProgressBar value={percent} tone={days != null && days < 0 ? 'red' : days != null && days <= 7 ? 'amber' : 'green'} /></div>
        </div>
      </div>
    </DetailCard>
  );
}

export function TemporaryRiskControls({ values, setValues, onSave }: { values: any; setValues: (fn: any) => void; onSave: () => void }) {
  return (
    <DetailCard
      title="Temporary Risk Controls"
      action={
        <MocButton variant="primary" onClick={onSave} icon={<CheckCircle2 className="h-4 w-4" />}>
          Save Controls
        </MocButton>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Reason for Temporary Change"><textarea className={detailTextarea} value={values.reason ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, reason: e.target.value }))} /></Field>
        <Field label="Temporary Risk Controls"><textarea className={detailTextarea} value={values.riskControls ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, riskControls: e.target.value }))} /></Field>
        <Field label="Review Frequency"><input className={detailInput} value={values.reviewFrequency ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, reviewFrequency: e.target.value }))} /></Field>
        <Field label="Responsible Owner ID"><input className={detailInput} value={values.responsibleOwnerId ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, responsibleOwnerId: e.target.value }))} /></Field>
        <Field label="Temporary Operating Limits"><textarea className={detailTextarea} value={values.temporaryOperatingLimits ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, temporaryOperatingLimits: e.target.value }))} /></Field>
        <Field label="Temporary Procedure Reference"><textarea className={detailTextarea} value={values.temporaryProcedureReference ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, temporaryProcedureReference: e.target.value }))} /></Field>
      </div>
    </DetailCard>
  );
}

export function ReversalRemovalPlan({ values, setValues, onRemovalComplete }: { values: any; setValues: (fn: any) => void; onRemovalComplete: () => void }) {
  return (
    <DetailCard
      title="Reversal / Removal Plan"
      action={
        <MocButton variant="outline" onClick={onRemovalComplete} icon={<RotateCcw className="h-4 w-4" />}>
          Mark Removal Complete
        </MocButton>
      }
    >
      <Field label="Reversal / Removal Plan"><textarea className={detailTextarea} value={values.reversalPlan ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, reversalPlan: e.target.value }))} /></Field>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Info label="Verification Required" value={values.removalVerificationRequired === false ? 'No' : 'Yes'} />
        <Info label="Removal Completed" value={values.removalCompleted ? 'Yes' : 'No'} />
        <Info label="Removal Evidence" value={values.removalEvidenceAttachmentId ?? 'Not uploaded'} />
      </div>
    </DetailCard>
  );
}

export function TemporaryExtensionRequests({ request, setRequest, onRequest, onApprove, onReject }: { request: any; setRequest: (fn: any) => void; onRequest: () => void; onApprove: () => void; onReject: () => void }) {
  return (
    <DetailCard title="Extension Requests">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Requested Expiry Date"><input className={detailInput} type="date" value={request.requestedExpiryDate ?? ''} onChange={(e) => setRequest((v: any) => ({ ...v, requestedExpiryDate: e.target.value }))} /></Field>
        <Field label="Risk Reassessment"><input className={detailInput} value={request.riskReassessment ?? ''} onChange={(e) => setRequest((v: any) => ({ ...v, riskReassessment: e.target.value }))} /></Field>
        <div className="md:col-span-2"><Field label="Extension Justification"><textarea className={detailTextarea} value={request.justification ?? ''} onChange={(e) => setRequest((v: any) => ({ ...v, justification: e.target.value }))} /></Field></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <MocButton variant="primary" onClick={onRequest} icon={<TimerReset className="h-4 w-4" />}>Request Extension</MocButton>
        <MocButton variant="outline" onClick={onApprove}>Approve Extension</MocButton>
        <MocButton variant="danger" onClick={onReject}>Reject Extension</MocButton>
      </div>
    </DetailCard>
  );
}

export function TemporaryExtensionHistory({ extensions }: { extensions: any[] }) {
  return (
    <DetailCard title="Extension History">
      {extensions?.length ? (
        <div className="space-y-2">
          {extensions.map((row) => (
            <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[var(--psm-fg)]">{row.requested_expiry_date}</p>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-fg)]">{row.justification}</p>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">Old expiry {row.old_expiry_date ?? '-'} · approved {row.approved_expiry_date ?? '-'}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No extension history." />
      )}
    </DetailCard>
  );
}

export function TemporaryEscalationPanel({
  escalation,
  onRunSweep,
  isRunning
}: {
  escalation: any;
  onRunSweep?: () => void;
  isRunning?: boolean;
}) {
  return (
    <DetailCard
      title="Expiry Notifications / Automated Escalations"
      action={
        onRunSweep ? (
          <MocButton variant="primary" onClick={onRunSweep} disabled={isRunning}>
            {isRunning ? 'Running Sweep...' : 'Run Auto-Escalation Sweep'}
          </MocButton>
        ) : undefined
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Metric label="30-Day Warning" value={escalation?.warning30Day ? 'Active' : 'No'} tone={escalation?.warning30Day ? 'amber' : 'slate'} />
        <Metric label="7-Day Final" value={escalation?.finalWarning7Day ? 'Active' : 'No'} tone={escalation?.finalWarning7Day ? 'red' : 'slate'} />
        <Metric label="Overdue" value={escalation?.overdue ? 'Yes' : 'No'} tone={escalation?.overdue ? 'red' : 'green'} />
        <Metric label="Escalated To" value={escalation?.escalationLevel ?? 'None'} tone="blue" />
      </div>
    </DetailCard>
  );
}

export function EmergencySummaryCard({ data }: { data: any }) {
  const summary = data?.summary ?? {};
  return (
    <DetailCard title="Emergency Change Summary">
      {!data?.applicable ? <EmptyState title="This MOC is not an emergency change." /> : null}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Metric label="Review Status" value={summary.reviewStatus ?? '-'} tone={statusTone(summary.reviewStatus)} />
        <Metric label="72-Hour Countdown" value={summary.hoursRemaining ?? '-'} tone={(summary.hoursRemaining ?? 999) < 0 ? 'red' : (summary.hoursRemaining ?? 999) <= 12 ? 'amber' : 'green'} sub="hours remaining" />
        <Metric label="Permanent MOC Required" value={summary.permanentMocRequired ? 'Yes' : 'No'} tone={summary.permanentMocRequired ? 'amber' : 'slate'} />
        <Metric label="Overdue" value={summary.overdue ? 'Yes' : 'No'} tone={summary.overdue ? 'red' : 'green'} />
      </div>
    </DetailCard>
  );
}

export function EmergencyJustificationPanel({ values, setValues, onSave }: { values: any; setValues: (fn: any) => void; onSave: () => void }) {
  return (
    <DetailCard
      title="Emergency Justification"
      action={
        <MocButton variant="primary" onClick={onSave} icon={<Flame className="h-4 w-4" />}>
          Save Controls
        </MocButton>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Emergency Justification"><textarea className={detailTextarea} value={values.emergencyJustification ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, emergencyJustification: e.target.value }))} /></Field>
        <Field label="Reason Normal Workflow Was Bypassed"><textarea className={detailTextarea} value={values.bypassReason ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, bypassReason: e.target.value }))} /></Field>
        <Field label="Implemented By"><input className={detailInput} value={values.implementedBy ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, implementedBy: e.target.value }))} /></Field>
        <Field label="Implemented At"><input className={detailInput} type="datetime-local" value={String(values.implementedAt ?? '').slice(0, 16)} onChange={(e) => setValues((v: any) => ({ ...v, implementedAt: e.target.value }))} /></Field>
      </div>
    </DetailCard>
  );
}

export function ImmediateRiskControls({ values, setValues }: { values: any; setValues: (fn: any) => void }) {
  return (
    <DetailCard title="Immediate Risk Controls">
      <Field label="Immediate Controls"><textarea className={detailTextarea} value={values.immediateControls ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, immediateControls: e.target.value }))} /></Field>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Affected Equipment / Area"><input className={detailInput} value={values.affectedEquipmentArea ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, affectedEquipmentArea: e.target.value }))} /></Field>
        <Field label="Initial Approval Authority ID"><input className={detailInput} value={values.initialApprovalAuthorityId ?? ''} onChange={(e) => setValues((v: any) => ({ ...v, initialApprovalAuthorityId: e.target.value }))} /></Field>
      </div>
    </DetailCard>
  );
}

export function PostImplementationReview({ review, setReview, onComplete }: { review: any; setReview: (fn: any) => void; onComplete: () => void }) {
  return (
    <DetailCard
      title="Post-Implementation Review"
      action={
        <MocButton variant="primary" onClick={onComplete} icon={<CheckCircle2 className="h-4 w-4" />}>
          Complete Review
        </MocButton>
      }
    >
      <Field label="Review Findings"><textarea className={detailTextarea} value={review.reviewFindings ?? ''} onChange={(e) => setReview((v: any) => ({ ...v, reviewFindings: e.target.value }))} /></Field>
      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--psm-fg)]">
        <input type="checkbox" checked={Boolean(review.additionalActionsRequired)} onChange={(e) => setReview((v: any) => ({ ...v, additionalActionsRequired: e.target.checked }))} className="rounded border-[var(--psm-line)] text-primary focus:ring-primary" />
        Additional actions required
      </label>
    </DetailCard>
  );
}

export function EmergencyReviewCountdown({ data }: { data: any }) {
  const summary = data?.summary ?? {};
  return (
    <DetailCard title="72-Hour Review Countdown">
      <div className="flex items-center gap-4">
        <ShieldAlert className={`h-12 w-12 ${summary.overdue ? 'text-red-500' : 'text-amber-500'}`} />
        <div>
          <p className="text-2xl font-black text-[var(--psm-fg)]">{summary.hoursRemaining ?? '-'} hours</p>
          <p className="text-sm text-[var(--psm-muted)]">Review due {summary.reviewDueAt ? new Date(summary.reviewDueAt).toLocaleString() : 'not set'}</p>
        </div>
      </div>
    </DetailCard>
  );
}

export function EmergencyFollowupActions({ action, setAction, onCreate }: { action: any; setAction: (fn: any) => void; onCreate: () => void }) {
  return (
    <DetailCard
      title="Emergency Follow-Up Actions"
      action={
        <MocButton variant="outline" onClick={onCreate} icon={<AlertTriangle className="h-4 w-4" />}>
          Create Follow-Up Action
        </MocButton>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Action Title"><input className={detailInput} value={action.title ?? ''} onChange={(e) => setAction((v: any) => ({ ...v, title: e.target.value }))} /></Field>
        <Field label="Owner ID"><input className={detailInput} value={action.ownerId ?? ''} onChange={(e) => setAction((v: any) => ({ ...v, ownerId: e.target.value }))} /></Field>
        <div className="md:col-span-2"><Field label="Description"><textarea className={detailTextarea} value={action.description ?? ''} onChange={(e) => setAction((v: any) => ({ ...v, description: e.target.value }))} /></Field></div>
      </div>
    </DetailCard>
  );
}

export function EmergencyEscalationPanel({ escalation }: { escalation: any }) {
  return (
    <DetailCard title="Emergency Escalation Panel">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Overdue Review" value={escalation?.overdue ? 'Yes' : 'No'} tone={escalation?.overdue ? 'red' : 'green'} />
        <Metric label="Escalated To" value={escalation?.escalatedTo ?? 'None'} tone="amber" />
        <Metric label="Escalation Type" value={escalation?.escalationType ?? 'None'} tone="blue" />
      </div>
    </DetailCard>
  );
}

export function NormalizationRiskIndicator({ risk }: { risk: boolean }) {
  return (
    <DetailCard title="Normalization Risk Indicator">
      <div className={`rounded-xl border p-4 ${risk ? 'border-amber-500/25 bg-amber-500/10' : 'border-emerald-500/25 bg-emerald-500/10'}`}>
        <div className="flex items-center gap-3">
          {risk ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          <div>
            <p className="font-black text-[var(--psm-fg)]">{risk ? 'Normalization risk active' : 'No normalization risk'}</p>
            <p className="text-sm text-[var(--psm-muted)]">Temporary changes active longer than 60 days are highlighted for management review.</p>
          </div>
        </div>
      </div>
    </DetailCard>
  );
}

export function TemporaryActions({ onConvert, onReminder }: { onConvert: () => void; onReminder: () => void }) {
  return (
    <DetailCard title="Temporary Actions">
      <div className="grid gap-3 sm:grid-cols-2">
        <MocButton variant="outline" onClick={onReminder} icon={<Bell className="h-4 w-4" />}>
          Send Expiry Reminder
        </MocButton>
        <MocButton variant="primary" onClick={onConvert} icon={<FileUp className="h-4 w-4" />}>
          Convert To Permanent MOC
        </MocButton>
      </div>
    </DetailCard>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--psm-fg)]">{value ?? '-'}</p>
    </div>
  );
}

const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs font-bold text-[var(--psm-fg)] hover:bg-[var(--psm-surface)] disabled:opacity-50';
const primary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50';
const danger = 'inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-200 hover:bg-red-500/20 disabled:opacity-50';

export { button as tempButton, primary as tempPrimary, danger as tempDanger };
