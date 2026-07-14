'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { SidebarUserCard } from './SidebarUserCard';
import { UserMenuDropdown } from './UserMenuDropdown';
import { useSidebarProfile } from './hooks/useSidebarProfile';

export function SidebarFooterUserMenu({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const profile = useSidebarProfile();
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();

  async function logout() {
    if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new Event('psm:before-logout'));
    try {
      await api.post('/auth/logout');
    } catch {
      // Local session is still cleared when API logout is unavailable.
    } finally {
      clearSession();
      setOpen(false);
      router.push('/login');
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open user account menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-left transition hover:border-info/50 hover:bg-[var(--psm-surface-3)] focus:outline-none focus:ring-2 focus:ring-info/40 ${collapsed ? 'lg:grid lg:place-items-center lg:border-transparent lg:bg-transparent lg:p-2' : ''}`}
        title={collapsed ? `${profile.data?.user.fullName ?? 'User'}\n${profile.data?.user.email ?? ''}` : undefined}
      >
        <SidebarUserCard data={profile.data} collapsed={collapsed} open={open} />
      </button>
      {open ? <UserMenuDropdown data={profile.data} onClose={() => { setOpen(false); onNavigate(); }} onLogout={() => void logout()} /> : null}
    </div>
  );
}
