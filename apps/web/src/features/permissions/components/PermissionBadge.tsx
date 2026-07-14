import { getPermissionDisplayName } from '../utils/getPermissionDisplayName';
import type { PermissionUiItem } from '../types/permission-ui.types';
import { PermissionScopeBadge } from './PermissionScopeBadge';

export function PermissionBadge({ permission, readOnly = true }: { permission: PermissionUiItem; readOnly?: boolean }) {
  const denied = permission.denied || permission.allowed === false;
  return (
    <div className={`rounded-lg border p-3 text-sm ${denied ? 'border-danger/30 bg-danger/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold">{getPermissionDisplayName(permission.key, permission.label)}</div>
          <div className="mt-1 break-all text-xs text-[var(--psm-muted)]">{permission.key}</div>
        </div>
        <span className={denied ? 'psm-badge psm-badge-danger' : 'psm-badge psm-badge-success'}>{denied ? 'Denied' : 'Allowed'}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PermissionScopeBadge scope={permission.scope} />
        {permission.source ? <span className="psm-badge psm-badge-muted">{permission.source}</span> : null}
        {readOnly ? <span className="psm-badge psm-badge-muted">Read-only</span> : null}
      </div>
    </div>
  );
}

