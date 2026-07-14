'use client';

export function InvitationStatusBadge({ status }: { status?: string | null }) {
  const normalized = status ?? 'Not Invited';
  const className = normalized.toLowerCase().includes('accepted') ? 'psm-badge psm-badge-success' : normalized.toLowerCase().includes('pending') ? 'psm-badge psm-badge-warning' : 'psm-badge psm-badge-muted';
  return <span className={className}>{normalized}</span>;
}
