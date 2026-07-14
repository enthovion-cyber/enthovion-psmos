import { TonePill } from '../overview/LopaOverviewShared';
import { TeamTable } from './TeamSessionsUi';

export function SessionsRegister({ rows, onOpen, onEdit, onCancel, onComplete }: any) {
  return (
    <TeamTable
      columns={['Session', 'Date / Time', 'Facilitator / Scribe', 'Agenda', 'Attendance', 'Quorum', 'Minutes', 'Actions', 'Status', 'Controls']}
      empty="No LOPA sessions scheduled yet."
      rows={(rows ?? []).map((row: any) => (
        <tr key={row.id} className="text-slate-200">
          <td className="px-3 py-3"><button className="font-bold text-blue-200" onClick={() => onOpen(row)}>{row.session_title}</button><div className="text-xs text-slate-500">{row.session_number} - {row.session_type}</div></td>
          <td className="px-3 py-3">{row.start_time ?? '-'}<div className="text-xs text-slate-500">{row.location ?? row.meeting_link ?? '-'}</div></td>
          <td className="px-3 py-3">{row.facilitator_name ?? '-'}<div className="text-xs text-slate-500">Scribe: {row.scribe_name ?? '-'}</div></td>
          <td className="px-3 py-3"><TonePill>{row.agenda_status}</TonePill></td>
          <td className="px-3 py-3"><TonePill tone={row.attendance_status === 'Complete' ? 'success' : 'warning'}>{row.attendance_status}</TonePill></td>
          <td className="px-3 py-3"><TonePill tone={row.quorum_status === 'Met' ? 'success' : 'danger'}>{row.quorum_status}</TonePill></td>
          <td className="px-3 py-3"><TonePill tone={row.minutes_status === 'Locked' ? 'success' : row.minutes_status === 'Complete' ? 'success' : 'warning'}>{row.minutes_status}</TonePill></td>
          <td className="px-3 py-3">{row.open_actions_count ?? 0}</td>
          <td className="px-3 py-3"><TonePill>{row.status}</TonePill></td>
          <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button className="text-blue-200" onClick={() => onEdit(row)}>Edit</button><button className="text-emerald-200" onClick={() => onComplete(row)}>Complete</button><button className="text-red-200" onClick={() => onCancel(row)}>Cancel</button></div></td>
        </tr>
      ))}
    />
  );
}
