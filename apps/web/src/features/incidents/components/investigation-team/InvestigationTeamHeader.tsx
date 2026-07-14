import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { TeamStatusBadge } from '../shared/TeamStatusBadge';

function action(data: any, key: string) {
  return data.actions?.find((item: any) => item.key === key) ?? { enabled: true };
}

function ActionButton({ data, actionKey, children, onClick, saving, primary = false }: any) {
  const meta = action(data, actionKey);
  const disabled = saving || meta.enabled === false;
  return (
    <button className={primary ? buttonPrimary : buttonSecondary} disabled={disabled} title={disabled ? meta.disabledReason ?? 'Action is not available.' : ''} onClick={onClick}>
      {children}
    </button>
  );
}

export function InvestigationTeamHeader({ data, onAdd, onAssignOwner, onAssignLead, onGenerateRoles, onNotify, onReminder, onRequestReview, onApprove, onReject, onScheduleMeeting, onCreateAction, onSave, onRefresh, saving, message }: any) {
  const header = data.header ?? {};
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Investigation Team</h2>
            <TeamStatusBadge value={header.teamStatus ?? header.readinessStatus} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Incident {header.incidentNumber} · {header.incidentTitle ?? 'Untitled incident'} · Priority {header.investigationPriority ?? '-'} · Level {header.investigationLevel ?? '-'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Members {header.memberCount ?? 0} · Active {header.activeMembers ?? 0} · Missing roles {header.requiredRolesMissing ?? 0} · Pending acceptance {header.pendingAcceptance ?? 0} · Overdue {header.overdueAssignments ?? 0} · Last updated {formatDate(header.lastUpdated)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton data={data} actionKey="assign-owner" saving={saving} onClick={onAssignOwner}>Assign Owner</ActionButton>
          <ActionButton data={data} actionKey="assign-owner" saving={saving} onClick={onAssignOwner}>Change Owner</ActionButton>
          <ActionButton data={data} actionKey="assign-lead" saving={saving} onClick={onAssignLead}>Assign Lead</ActionButton>
          <ActionButton data={data} actionKey="assign-lead" saving={saving} onClick={onAssignLead}>Change Lead</ActionButton>
          <ActionButton data={data} actionKey="add-member" saving={saving} primary onClick={onAdd}>Add Team Member</ActionButton>
          <ActionButton data={data} actionKey="generate-roles" saving={saving} onClick={onGenerateRoles}>Build Team from Template</ActionButton>
          <ActionButton data={data} actionKey="generate-roles" saving={saving} onClick={onGenerateRoles}>Generate Required Roles</ActionButton>
          <ActionButton data={data} actionKey="send-notification" saving={saving} onClick={onNotify}>Send Assignment Notification</ActionButton>
          <ActionButton data={data} actionKey="send-reminder" saving={saving} onClick={onReminder}>Send Reminder</ActionButton>
          <ActionButton data={data} actionKey="request-review" saving={saving} onClick={onRequestReview}>Request Approval</ActionButton>
          <ActionButton data={data} actionKey="approve-review" saving={saving} onClick={onApprove}>Approve Team</ActionButton>
          <ActionButton data={data} actionKey="reject-review" saving={saving} onClick={onReject}>Reject Team</ActionButton>
          <ActionButton data={data} actionKey="request-review" saving={saving} onClick={onRequestReview}>Reopen Review</ActionButton>
          <ActionButton data={data} actionKey="schedule-meeting" saving={saving} onClick={onScheduleMeeting}>Schedule Meeting</ActionButton>
          <ActionButton data={data} actionKey="create-action" saving={saving} onClick={onCreateAction}>Create Action</ActionButton>
          <button className={buttonSecondary} disabled={saving} onClick={onSave}>Save Changes</button>
          <button className={buttonSecondary} disabled={saving} onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-300/30 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}
