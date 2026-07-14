import type { PermissionUiScope } from '../types/permission-ui.types';

export function PermissionScopeBadge({ scope }: { scope?: string | PermissionUiScope | null | undefined }) {
  if (!scope) return <span className="psm-badge psm-badge-muted">Tenant scope</span>;
  if (typeof scope === 'string') return <span className="psm-badge psm-badge-muted">{scope}</span>;
  const siteCount = scope.siteIds?.length ?? 0;
  const unitCount = scope.unitIds?.length ?? 0;
  const areaCount = scope.areaIds?.length ?? 0;
  const companyCount = scope.companyIds?.length ?? 0;
  const label = siteCount ? `${siteCount} site${siteCount === 1 ? '' : 's'}` : unitCount ? `${unitCount} unit${unitCount === 1 ? '' : 's'}` : areaCount ? `${areaCount} area${areaCount === 1 ? '' : 's'}` : companyCount ? `${companyCount} compan${companyCount === 1 ? 'y' : 'ies'}` : 'Tenant scope';
  return <span className="psm-badge psm-badge-muted">{label}</span>;
}
