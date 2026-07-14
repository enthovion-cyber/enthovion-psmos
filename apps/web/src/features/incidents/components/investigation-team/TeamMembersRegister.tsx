import { AcceptanceStatusBadge } from '../shared/AcceptanceStatusBadge';
import { CompetencyStatusBadge } from '../shared/CompetencyStatusBadge';
import { Badge } from '../shared/IncidentStatusBadge';
import { TeamRoleBadge } from '../shared/TeamRoleBadge';
import { TabPanel, formatDate } from '../shared/IncidentTabPrimitives';
import { ProfileBadge } from './InvestigationTeamPrimitives';

export function TeamMembersRegister({ rows, onEdit, onDelete, onReplace, onNotify, onAccept, onDecline, onCreateAction, canDelete, canReplace }: any) {
  return (
    <TabPanel title="Team Members Register">
      {!rows?.length ? (
        <p className="text-xs text-slate-500">No investigation team members assigned.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[1680px] text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="p-2">Member</th>
                <th>Profile</th>
                <th>Role</th>
                <th>Discipline</th>
                <th>Department</th>
                <th>Company / Site</th>
                <th>Responsibility</th>
                <th>Required</th>
                <th>Acceptance</th>
                <th>Active</th>
                <th>Approval</th>
                <th>Availability</th>
                <th>Conflict</th>
                <th>Competency</th>
                <th>Assigned</th>
                <th>Accepted / Declined</th>
                <th>Last notification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="border-t border-slate-200 align-top dark:border-cyan-300/10">
                  <td className="p-2">
                    <div className="font-bold">{row.display_name ?? row.member_name ?? row.email ?? '-'}</div>
                    <div className="text-slate-500">{row.email ?? '-'}</div>
                  </td>
                  <td><ProfileBadge value={row.profile_status ?? row.profileStatus} /></td>
                  <td><TeamRoleBadge value={row.team_role} /></td>
                  <td>{row.discipline ?? '-'}</td>
                  <td>{row.department ?? '-'}</td>
                  <td>
                    <div>{row.organization ?? row.company_name ?? row.contractor_company ?? '-'}</div>
                    <div className="text-slate-500">{row.site_name ?? row.site ?? '-'}</div>
                  </td>
                  <td className="max-w-[220px] whitespace-normal">{row.responsibility ?? '-'}</td>
                  <td>{row.required_role ?? row.required_member ? 'Yes' : 'No'}</td>
                  <td><AcceptanceStatusBadge value={row.acceptance_status} /></td>
                  <td><Badge value={row.active_status ?? row.status} /></td>
                  <td><Badge value={row.approval_status ?? 'Not Required'} /></td>
                  <td><Badge value={row.availability_status} /></td>
                  <td><Badge value={row.conflict_status ?? (row.conflict_declared ? 'Declared' : 'None')} /></td>
                  <td><CompetencyStatusBadge value={row.competency_status} /></td>
                  <td>
                    <div>{row.assigned_by_name ?? row.assigned_by ?? '-'}</div>
                    <div className="text-slate-500">{formatDate(row.assigned_at ?? row.created_at)}</div>
                  </td>
                  <td>
                    <div>{formatDate(row.accepted_at)}</div>
                    <div className="text-slate-500">{formatDate(row.declined_at)}</div>
                  </td>
                  <td>{formatDate(row.last_notification_sent_at ?? row.last_reminder_sent_at)}</td>
                  <td>
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      <button className="text-blue-600" onClick={() => onEdit(row)}>Edit</button>
                      <button className="text-blue-600" onClick={() => onNotify(row)}>Notify</button>
                      <button className="text-emerald-600" onClick={() => onAccept(row)}>Mark accepted</button>
                      <button className="text-amber-600" onClick={() => onDecline(row)}>Mark declined</button>
                      {canReplace ? <button className="text-purple-600" onClick={() => onReplace(row)}>Replace</button> : null}
                      <button className="text-slate-600 dark:text-slate-300" onClick={() => onCreateAction(row)}>Create action</button>
                      {canDelete ? <button className="text-red-600" onClick={() => onDelete(row)}>Remove</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TabPanel>
  );
}
