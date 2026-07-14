'use client';

export function HazopProgressBar({ label, percent, helper, tone = 'bg-primary' }: { label: string; percent: number; helper?: string; tone?: string }) {
  const value = Math.max(0, Math.min(100, Number(percent ?? 0)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-[var(--psm-text)]">{label}</span>
        <span className="text-[var(--psm-muted)]">{helper ?? `${value}%`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
