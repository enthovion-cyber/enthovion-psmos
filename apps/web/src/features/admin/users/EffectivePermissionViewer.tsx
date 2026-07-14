'use client';

import type { EffectivePermissionSummary } from '@/services/iam.service';
import { PermissionModuleAccordion } from '@/features/permissions/components/PermissionModuleAccordion';

export function EffectivePermissionViewer({ summary }: { summary?: EffectivePermissionSummary }) {
  return (
    <section className="psm-card p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Effective Permissions</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Merged role grants, aliases, user overrides, and active company/site scope.</p>
      </div>
      {summary ? (
        <PermissionModuleAccordion modules={summary.permissionModules ?? summary.modules} mode="admin-view" readOnly showSearch showCounts hideEmptyModules />
      ) : (
        <span className="text-sm text-[var(--psm-muted)]">No permission summary loaded.</span>
      )}
    </section>
  );
}
