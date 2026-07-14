'use client';

import type { HazopOverviewProfile } from '../../types/hazop-overview.types';

function colorFor(name?: string | null) {
  const colors = ['bg-blue-500/20 text-blue-200', 'bg-emerald-500/20 text-emerald-200', 'bg-amber-500/20 text-amber-200', 'bg-purple-500/20 text-purple-200', 'bg-cyan-500/20 text-cyan-200'];
  const index = (name ?? 'U').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export function HazopAvatar({ profile, label }: { profile?: HazopOverviewProfile | null; label?: string }) {
  if (!profile) return <span className="text-xs text-[var(--psm-muted)]">Unassigned</span>;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorFor(profile.name)}`}>{profile.initials ?? 'U'}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--psm-text)]">{profile.name}</div>
        <div className="truncate text-xs text-[var(--psm-muted)]">{label ?? profile.title ?? profile.email ?? '-'}</div>
      </div>
    </div>
  );
}

export function HazopAvatarGroup({ profiles }: { profiles: Array<HazopOverviewProfile | null | undefined> }) {
  const rows = profiles.filter(Boolean) as HazopOverviewProfile[];
  if (!rows.length) return <span className="text-xs text-[var(--psm-muted)]">No assigned users</span>;
  return (
    <div className="flex -space-x-2">
      {rows.slice(0, 6).map((profile, index) => (
        <div key={`${profile.id ?? profile.name}-${index}`} title={profile.name ?? ''} className={`flex h-8 w-8 items-center justify-center rounded-full border border-[var(--psm-surface)] text-xs font-semibold ${colorFor(profile.name)}`}>
          {profile.initials ?? 'U'}
        </div>
      ))}
      {rows.length > 6 ? <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--psm-surface)] bg-white/10 text-xs font-semibold">+{rows.length - 6}</div> : null}
    </div>
  );
}
