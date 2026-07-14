'use client';

import type { HazopTeamMember } from '../../types/hazop-team.types';
import { HazopAttendanceBadge } from './HazopAttendanceBadge';
import { HazopRoleBadge } from './HazopRoleBadge';

export function HazopTeamMemberDetailDrawer({ member, readonly, canManage, onClose, onEdit, onInvite, onRemove }: { member: HazopTeamMember; readonly?: boolean; canManage?: boolean; onClose: () => void; onEdit: () => void; onInvite: () => void; onRemove: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between"><div><h3 className="text-xl font-semibold">{member.display_name ?? member.name}</h3><p className="text-sm text-[var(--psm-muted)]">{member.email ?? 'No email'} · {member.company_name ?? 'Internal'}</p></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2">Close</button></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2"><Metric label="Role" value={<HazopRoleBadge value={member.role ?? member.study_role} />} /><Metric label="Discipline" value={member.discipline ?? '-'} /><Metric label="Attendance" value={<HazopAttendanceBadge value={member.attendancePercentage ?? 0} />} /><Metric label="Open actions" value={member.openActions ?? 0} /><Metric label="Sign-off" value={member.signoff_required ? member.signoff_status ?? 'Pending' : 'Not required'} /><Metric label="Status" value={member.status ?? '-'} /></div>
        <section className="mt-5 rounded-xl border border-[var(--psm-line)] p-4"><h4 className="font-semibold">Notes</h4><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--psm-muted)]">{member.notes ?? 'No notes captured.'}</p></section>
        {canManage && !readonly ? <div className="mt-5 grid gap-2"><button onClick={onEdit} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white">Edit member</button><button onClick={onInvite} className="rounded-lg border border-[var(--psm-line)] px-4 py-2">Send invite / notification</button><button onClick={onRemove} className="rounded-lg border border-red-500/30 px-4 py-2 text-red-300">Remove / replace member</button></div> : null}
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-2 font-semibold">{value}</div></div>;
}
