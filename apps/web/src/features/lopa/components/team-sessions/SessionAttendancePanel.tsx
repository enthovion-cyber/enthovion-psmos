import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { TeamTable } from './TeamSessionsUi';

export function SessionAttendancePanel({ rows, canEdit, onBulkPresent, onSave }: any) {
  return (
    <LopaPanel title="Attendance" action={canEdit ? <div className="flex gap-2"><button className="text-xs font-bold text-emerald-200" onClick={onBulkPresent}>Bulk Present</button><button className="text-xs font-bold text-blue-200" onClick={onSave}>Save Attendance</button></div> : null}>
      <TeamTable
        columns={['Member', 'Role', 'Required', 'Status', 'Time', 'Substitute', 'Confirmed', 'Notes']}
        empty="Attendance rows will appear when a session has team members assigned."
        rows={(rows ?? []).map((row: any) => (
          <tr key={row.id} className="text-slate-200">
            <td className="px-3 py-3"><b className="text-white">{row.member_name}</b></td>
            <td className="px-3 py-3">{row.study_role}<div className="text-xs text-slate-500">{row.discipline}</div></td>
            <td className="px-3 py-3">{row.required_attendee ? 'Yes' : 'No'}</td>
            <td className="px-3 py-3"><TonePill tone={row.attendance_status === 'Present' ? 'success' : row.attendance_status === 'Absent' ? 'danger' : 'warning'}>{row.attendance_status}</TonePill></td>
            <td className="px-3 py-3 text-slate-400">{row.join_time ?? '-'} / {row.leave_time ?? '-'}</td>
            <td className="px-3 py-3">{row.substitute_member_name ?? '-'}</td>
            <td className="px-3 py-3">{row.confirmed_at ?? '-'}</td>
            <td className="px-3 py-3 text-slate-400">{row.notes ?? row.absence_reason ?? '-'}</td>
          </tr>
        ))}
      />
    </LopaPanel>
  );
}
