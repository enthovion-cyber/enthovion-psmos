'use client';

export function RoleScopeBadge({ scope }: { scope?: string | null }) {
  return <span className="psm-badge psm-badge-info">{scope ?? 'Tenant'}</span>;
}
