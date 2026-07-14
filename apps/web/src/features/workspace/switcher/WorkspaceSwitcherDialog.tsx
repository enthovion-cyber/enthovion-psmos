'use client';

import { CompanySwitcher } from './CompanySwitcher';
import { WorkspaceSiteSwitcher } from './SiteSwitcher';

export function WorkspaceSwitcherDialog() {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-xl">
      <CompanySwitcher />
      <WorkspaceSiteSwitcher />
    </div>
  );
}
