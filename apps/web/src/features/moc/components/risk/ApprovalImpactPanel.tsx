'use client';

import { Route } from 'lucide-react';
import { Badge, DetailCard } from '../moc-detail-ui';

export function ApprovalImpactPanel({ risk }: { risk: any }) {
  const impact = risk?.workflow_impact ?? {};
  const path = impact.approvalPath ?? [];
  return (
    <DetailCard title="Required Approval Impact" action={<Badge tone={impact.requiresManagementEscalation ? 'amber' : 'green'}>{impact.routeType ?? 'Standard MOC Workflow'}</Badge>}>
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm text-slate-300"><Route className="h-4 w-4 text-blue-300" />{impact.notes ?? 'Risk ranking determines the approval path and escalation requirements.'}</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {path.map((item: string, index: number) => <div key={`${item}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/35 p-3 text-sm"><span className="mr-2 text-xs font-black text-blue-300">{String(index + 1).padStart(2, '0')}</span>{item}</div>)}
        </div>
      </div>
    </DetailCard>
  );
}
