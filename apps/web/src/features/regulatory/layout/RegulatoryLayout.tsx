'use client';

import type { ReactNode } from 'react';
import { RegulatoryBreadcrumbs } from './RegulatoryBreadcrumbs';
import { RegulatorySidebar } from './RegulatorySidebar';

export function RegulatoryLayout({ children, current }: { children: ReactNode; current?: string | undefined }) {
  return (
    <div className="space-y-5">
      <RegulatoryBreadcrumbs current={current} />
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <RegulatorySidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
