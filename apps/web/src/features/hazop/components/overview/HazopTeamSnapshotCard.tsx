'use client';

import { CalendarDays, UsersRound } from 'lucide-react';
import { HazopAvatar, HazopAvatarGroup } from './HazopAvatarGroup';
import { HazopDisciplineCoverageBar } from './HazopDisciplineCoverageBar';

export function HazopTeamSnapshotCard({ teamSnapshot, onNavigate }: { teamSnapshot: any; onNavigate: (tab?: string) => void }) {
  const missing = teamSnapshot.missingDisciplines?.length ?? 0;
  const covered = (teamSnapshot.coverage ?? []).filter((row: any) => row.coverage_status === 'Covered').length;
  const optional = (teamSnapshot.coverage ?? []).filter((row: any) => row.coverage_status === 'Optional').length;
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">4. Team Snapshot</h3>
        <button onClick={() => onNavigate('Team & Sessions')} className="text-xs font-semibold text-primary">Open team</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <HazopAvatar profile={teamSnapshot.leader} label="Study Leader" />
        <HazopAvatar profile={teamSnapshot.scribe} label="Scribe" />
        <HazopAvatar profile={teamSnapshot.facilitator} label="Facilitator" />
        <HazopAvatar profile={teamSnapshot.hseRepresentative} label="HSE Representative" />
        <HazopAvatar profile={teamSnapshot.operationsRepresentative} label="Operations" />
        <div className="flex items-center gap-2 text-sm"><UsersRound size={16} className="text-primary" /><span>{teamSnapshot.totalTeamMembers ?? 0} team members</span></div>
      </div>
      <div className="mt-4 rounded-lg border border-[var(--psm-line)] p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Discipline Coverage</span>
          <span className="text-[var(--psm-muted)]">{covered} / {(teamSnapshot.coverage ?? []).length}</span>
        </div>
        <HazopDisciplineCoverageBar covered={covered} partial={optional} missing={missing} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Mini label="Required" value={teamSnapshot.requiredMembers ?? 0} />
        <Mini label="Optional" value={teamSnapshot.optionalMembers ?? 0} />
        <Mini label="Pending Sign-Offs" value={teamSnapshot.pendingSignoffs ?? 0} tone="text-amber-300" />
      </div>
      <div className="mt-4 rounded-lg border border-[var(--psm-line)] p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={15} className="text-primary" />Next Session</div>
        {teamSnapshot.nextSession ? (
          <div className="text-sm text-[var(--psm-muted)]">
            <div className="font-semibold text-[var(--psm-text)]">{teamSnapshot.nextSession.title}</div>
            <div>{teamSnapshot.nextSession.session_date ?? teamSnapshot.nextSession.planned_start ?? '-'}</div>
          </div>
        ) : <div className="text-sm text-[var(--psm-muted)]">No planned session.</div>}
      </div>
      <div className="mt-4"><HazopAvatarGroup profiles={[teamSnapshot.leader, teamSnapshot.scribe, teamSnapshot.facilitator, teamSnapshot.hseRepresentative, teamSnapshot.operationsRepresentative]} /></div>
    </section>
  );
}

function Mini({ label, value, tone = 'text-[var(--psm-text)]' }: { label: string; value: any; tone?: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className={`text-xl font-semibold ${tone}`}>{value}</div><div className="text-xs text-[var(--psm-muted)]">{label}</div></div>;
}
