'use client';

export function HazopRoleBadge({ value }: { value?: string | null | undefined }) {
  const role = value ?? 'Participant';
  const tone = role.includes('Leader') || role.includes('Approver') ? 'border-blue-400/40 bg-blue-500/15 text-blue-200' : role.includes('HSE') ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : role.includes('Contractor') ? 'border-purple-400/40 bg-purple-500/15 text-purple-200' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}>{role}</span>;
}
