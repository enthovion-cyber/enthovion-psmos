import type { ReactNode } from 'react';
import { AuditSidebar } from './AuditSidebar';

export function AuditLayout({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 xl:grid-cols-[280px_1fr]"><AuditSidebar /><div className="min-w-0">{children}</div></div>;
}
