'use client';

import { X } from 'lucide-react';
import { UserMenuSection } from './UserMenuSection';
import type { SidebarProfileResponse } from './types/sidebar-profile.types';

export function UserMenuDropdown({ data, onClose, onLogout }: { data: SidebarProfileResponse | undefined; onClose: () => void; onLogout: () => void }) {
  return (
    <div className="absolute bottom-[calc(100%+.75rem)] left-2 right-2 z-[70] max-h-[78vh] overflow-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-2xl lg:left-4 lg:right-auto lg:w-80">
      <div className="mb-2 flex items-start gap-3 border-b border-[var(--psm-line)] pb-3 pr-8">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white">
          {data?.user.avatarUrl ? <img src={data.user.avatarUrl} alt={data.user.fullName} className="h-full w-full object-cover" /> : initialsFor(data?.user.fullName ?? 'User')}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{data?.user.fullName ?? 'User'}</div>
          <div className="truncate text-xs text-[var(--psm-muted)]">{data?.user.email}</div>
          <div className="truncate text-xs text-[var(--psm-muted)]">{data?.workspace.companyName}</div>
        </div>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]" aria-label="Close user menu">
          <X size={15} />
        </button>
      </div>
      {data?.menuSections.map((section) => <UserMenuSection key={section.key} section={section} onNavigate={onClose} onLogout={onLogout} />)}
      {!data ? <div className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-muted)]">Loading user menu...</div> : null}
    </div>
  );
}

function initialsFor(value: string) {
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}
