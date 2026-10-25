'use client';

import type { HazopOverviewProfile } from '../../types/hazop-overview.types';

function colorFor(name?: string | null) {
  const colors = [
    'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300',
    'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300',
    'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300',
    'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-300',
    'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-300'
  ];
  const index = (name ?? 'U').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export function HazopAvatar({ profile, label }: { profile?: HazopOverviewProfile | null; label?: string }) {
  if (!profile) return <span className="text-xs text-[var(--psm-muted)]">Unassigned</span>;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border ${colorFor(profile.name)}`}>{profile.initials ?? 'U'}</div>
      <div className="min-w-0">
        <div className="truncate text-xs sm:text-sm font-semibold text-[var(--psm-text)]">{profile.name}</div>
        <div className="truncate text-[11px] text-[var(--psm-muted)]">{label ?? profile.title ?? profile.email ?? '-'}</div>
      </div>
    </div>
  );
}

export function HazopAvatarGroup({ profiles }: { profiles: Array<HazopOverviewProfile | null | undefined> }) {
  const rows = profiles.filter(Boolean) as HazopOverviewProfile[];
  if (!rows.length) return <span className="text-xs text-[var(--psm-muted)]">No assigned users</span>;
  return (
    <div className="flex -space-x-1.5">
      {rows.slice(0, 6).map((profile, index) => (
        <div key={`${profile.id ?? profile.name}-${index}`} title={profile.name ?? ''} className={`flex h-7 w-7 items-center justify-center rounded-full border border-[var(--psm-surface)] text-xs font-semibold ${colorFor(profile.name)}`}>
          {profile.initials ?? 'U'}
        </div>
      ))}
      {rows.length > 6 ? <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--psm-surface)] bg-[var(--psm-surface-2)] text-xs font-semibold text-[var(--psm-text)]">+{rows.length - 6}</div> : null}
    </div>
  );
}
