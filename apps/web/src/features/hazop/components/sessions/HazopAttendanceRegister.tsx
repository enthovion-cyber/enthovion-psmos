'use client';

import { useState } from 'react';
import type { HazopSession } from '../../types/hazop-session.types';
import { HazopAttendanceBadge } from '../team/HazopAttendanceBadge';

const statuses = ['Present', 'Absent', 'Partial', 'Excused', 'Substitute Attended', 'Not Required'];

export function HazopAttendanceRegister({ session, readonly, canManage, onMark }: { session: HazopSession; readonly?: boolean | undefined; canManage?: boolean | undefined; onMark: (values: Record<string, any>) => void }) {
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});
  const setDraft = (id: string, key: string, value: any) => setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? {}), [key]: value } }));
  return (
    <section className="rounded-xl border border-[var(--psm-line)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Attendance Register</h4>
        <HazopAttendanceBadge value={session.attendance_status ?? 'Not Started'} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              {['Session', 'Team Member', 'Required', 'Status', 'Join / Leave', 'Duration', 'Substitute', 'Comment', 'Marked', 'Action'].map((header) => <th key={header} className="border-b border-[var(--psm-line)] px-2 py-2 text-left">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {(session.attendance ?? []).map((row: any) => {
              const draft = drafts[row.id] ?? {};
              return (
                <tr key={row.id} className="border-b border-[var(--psm-line)]">
                  <td className="px-2 py-2">S{session.session_number}</td>
                  <td className="px-2 py-2"><div className="font-semibold">{row.memberName ?? row.teamMember?.name ?? row.user?.displayName ?? 'Participant'}</div><div className="text-xs text-[var(--psm-muted)]">{row.user?.email ?? row.teamMember?.email ?? ''}</div></td>
                  <td className="px-2 py-2">{row.required ? 'Required' : 'Optional'}</td>
                  <td className="px-2 py-2">{canManage && !readonly ? <select className="input min-w-36" value={draft.attendanceStatus ?? row.attendance_status ?? 'Present'} onChange={(e) => setDraft(row.id, 'attendanceStatus', e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select> : <HazopAttendanceBadge value={row.attendance_status} />}</td>
                  <td className="px-2 py-2 text-xs">{canManage && !readonly ? <div className="grid gap-1"><input type="datetime-local" className="input" value={draft.joinTime ?? toLocal(row.join_time)} onChange={(e) => setDraft(row.id, 'joinTime', e.target.value)} /><input type="datetime-local" className="input" value={draft.leaveTime ?? toLocal(row.leave_time)} onChange={(e) => setDraft(row.id, 'leaveTime', e.target.value)} /></div> : `${row.join_time ?? '-'} / ${row.leave_time ?? '-'}`}</td>
                  <td className="px-2 py-2">{row.duration_minutes ?? '-'}</td>
                  <td className="px-2 py-2">{canManage && !readonly ? <input className="input min-w-36" value={draft.substituteName ?? row.substitute_name ?? ''} onChange={(e) => setDraft(row.id, 'substituteName', e.target.value)} /> : row.substitute_name ?? row.substituteUser?.displayName ?? '-'}</td>
                  <td className="px-2 py-2">{canManage && !readonly ? <input className="input min-w-44" value={draft.comment ?? row.comment ?? ''} onChange={(e) => setDraft(row.id, 'comment', e.target.value)} /> : row.comment ?? '-'}</td>
                  <td className="px-2 py-2 text-xs text-[var(--psm-muted)]">{row.markedBy?.displayName ?? row.marked_by ?? '-'}<br />{row.marked_at ? new Date(row.marked_at).toLocaleString() : ''}</td>
                  <td className="px-2 py-2">{canManage && !readonly ? <button onClick={() => onMark({ teamMemberId: row.team_member_id, userId: row.user_id, required: row.required, attendanceStatus: draft.attendanceStatus ?? row.attendance_status ?? 'Present', joinTime: draft.joinTime, leaveTime: draft.leaveTime, substituteName: draft.substituteName, comment: draft.comment })} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs">Save</button> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!(session.attendance ?? []).length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">No attendance records seeded for this session.</div> : null}
    </section>
  );
}

function toLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}
