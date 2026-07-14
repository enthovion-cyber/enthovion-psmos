'use client';

export function AdminUserStatusBadge({ status }: { status?: string | null }) {
  const normalized = status ?? 'UNKNOWN';
  const className = normalized === 'ACTIVE' ? 'psm-badge psm-badge-success' : normalized === 'SUSPENDED' ? 'psm-badge psm-badge-warning' : 'psm-badge psm-badge-muted';
  return <span className={className}>{normalized}</span>;
}
