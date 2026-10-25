'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { UserMenuSection } from './UserMenuSection';
import type { SidebarProfileResponse } from './types/sidebar-profile.types';

export function UserMenuDropdown({ data, onClose, onLogout }: { data: SidebarProfileResponse | undefined; onClose: () => void; onLogout: () => void }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button type="button" aria-label="Close account menu" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label="Account and workspace menu" className="relative z-10 flex max-h-[min(82vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
      <div className="flex shrink-0 items-start gap-3 border-b border-[var(--psm-line)] p-5 pr-12">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white">
          {data?.user.avatarUrl ? <img src={data.user.avatarUrl} alt={data.user.fullName} className="h-full w-full object-cover" /> : initialsFor(data?.user.fullName ?? 'User')}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-[var(--psm-text)]">{data?.user.fullName ?? 'User'}</div>
          <div className="truncate text-sm text-[var(--psm-muted)]">{data?.user.email}</div>
          <div className="mt-1 truncate text-xs text-[var(--psm-muted)]">{data?.workspace.companyName}</div>
        </div>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]" aria-label="Close user menu">
          <X size={15} />
        </button>
      </div>
      <div className="user-menu-scroll min-h-0 overflow-y-auto p-5">
        {data?.menuSections.map((section) => <UserMenuSection key={section.key} section={section} onNavigate={onClose} onLogout={onLogout} />)}
        {!data ? <div className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-muted)]">Loading user menu...</div> : null}
      </div>
      </section>
    </div>
  , document.body);
}

function initialsFor(value: string) {
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}
