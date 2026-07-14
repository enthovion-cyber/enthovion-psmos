'use client';

export function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ];
  const score = checks.filter(Boolean).length;
  const label = score >= 5 ? 'Strong' : score >= 3 ? 'Fair' : 'Weak';
  return (
    <div className="mt-2">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
        <div className={score >= 5 ? 'h-full bg-success' : score >= 3 ? 'h-full bg-warning' : 'h-full bg-danger'} style={{ width: `${(score / checks.length) * 100}%` }} />
      </div>
      <div className="mt-1 text-xs text-[var(--psm-muted)]">Password strength: {label}</div>
    </div>
  );
}
