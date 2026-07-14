'use client';

import { useState } from 'react';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useSidebar } from '@/providers/SidebarProvider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[var(--psm-bg)] text-[var(--psm-text)]">
      <Sidebar />
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <Topbar onSearchOpen={() => setSearchOpen(true)} />
        <main className="mx-auto w-full max-w-[1800px] p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
