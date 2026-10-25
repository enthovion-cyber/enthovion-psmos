'use client';

import { Route } from 'lucide-react';
import { Badge, DetailCard } from '../moc-detail-ui';

export function ApprovalImpactPanel({ risk }: { risk: any }) {
  const impact = risk?.workflow_impact ?? {};
  const path = impact.approvalPath ?? [];

  return (
    <DetailCard
      title="Workflow Escalation Impact"
      action={
        <Badge tone={impact.requiresManagementEscalation ? 'amber' : 'green'}>
          {impact.routeType ?? 'Standard MOC Workflow'}
        </Badge>
      }
    >
      <div className="space-y-3.5">
        <p className="flex items-center gap-2 text-xs text-[var(--psm-muted)]">
          <Route className="h-4 w-4 text-primary shrink-0" />
          <span>{impact.notes ?? 'Risk ranking dynamically dictates the multi-discipline approval path and management escalation.'}</span>
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {path.map((item: string, index: number) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center gap-2.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-xs transition-colors"
            >
              <span className="font-mono text-xs font-bold text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-semibold text-[var(--psm-fg)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </DetailCard>
  );
}
