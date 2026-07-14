import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-[var(--psm-bg)] px-4 py-8 text-[var(--psm-text)]">{children}</div>;
}
