'use client';

export function HazopReadinessRing({ percent, label = 'Ready', size = 132 }: { percent: number; label?: string; size?: number }) {
  const value = Math.max(0, Math.min(100, Number(percent ?? 0)));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const tone = value >= 80 ? '#22c55e' : value >= 50 ? '#facc15' : '#ef4444';
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="12" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-semibold text-[var(--psm-text)]">{value}%</div>
        <div className="text-xs text-[var(--psm-muted)]">{label}</div>
      </div>
    </div>
  );
}
