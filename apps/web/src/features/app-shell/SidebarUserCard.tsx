import { ChevronUp } from 'lucide-react';
import { PlanStatusBadge } from './PlanStatusBadge';
import type { SidebarProfileResponse } from './types/sidebar-profile.types';

export function SidebarUserCard({ data, collapsed, open }: { data: SidebarProfileResponse | undefined; collapsed: boolean; open: boolean }) {
  const initials = initialsFor(data?.user.fullName ?? data?.user.email ?? 'User');
  if (collapsed) {
    return (
      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white" title={`${data?.user.fullName ?? 'User'}\n${data?.user.email ?? ''}`}>
        {data?.user.avatarUrl ? <img src={data.user.avatarUrl} alt={data.user.fullName} className="h-full w-full object-cover" /> : initials}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white ring-2 ring-[var(--psm-line)]">
        {data?.user.avatarUrl ? <img src={data.user.avatarUrl} alt={data.user.fullName} className="h-full w-full object-cover" /> : initials}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-semibold">{data?.user.fullName ?? 'Loading user...'}</div>
        <div className="truncate text-xs text-[var(--psm-muted)]">{data?.user.email ?? 'Loading profile...'}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {data?.user.primaryRoleLabel ? <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-semibold text-info">{data.user.primaryRoleLabel}</span> : null}
          <PlanStatusBadge billing={data?.billing} />
        </div>
        <div className="mt-1 truncate text-[10px] text-[var(--psm-muted)]">{data?.workspace.companyName ?? 'Workspace'}</div>
      </div>
      <ChevronUp size={16} className={`shrink-0 text-[var(--psm-muted)] transition ${open ? 'rotate-180' : ''}`} />
    </div>
  );
}

function initialsFor(value: string) {
  return value.split(/[ @.]+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}
