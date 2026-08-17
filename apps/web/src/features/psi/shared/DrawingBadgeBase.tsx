import type { ReactNode } from 'react';

export function DrawingBadgeBase({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' }) {
  const toneClass = tone === 'good' ? 'border-success/30 bg-success/10 text-success' : tone === 'warn' ? 'border-warning/30 bg-warning/10 text-warning' : tone === 'danger' ? 'border-danger/30 bg-danger/10 text-danger' : tone === 'info' ? 'border-info/30 bg-info/10 text-info' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}
